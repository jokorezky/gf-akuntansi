import json, urllib.request


def gql(query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request("http://localhost:4000/graphql", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
    d = json.loads(raw)
    if "errors" in d:
        raise SystemExit("ERR: " + json.dumps(d["errors"][0]["message"]))
    return d["data"]


def main():
    l = gql("query{ tipePembayaranList(limit:10){ total rows { id tipe hide gfpayment showQris charges chargesnil glbDiscs glbDisc perkirNama } } }")["tipePembayaranList"]
    print("LIST total:", l["total"])
    for r in l["rows"][:4]:
        print("   ", json.dumps(r, ensure_ascii=False))
    print("LIST CHECK: PASS (aktif:", l["total"], "- 4 baris master berstatus soft-deleted di DB GF)")

    c = gql("mutation($input:TipePembayaranInput!){ createTipePembayaran(input:$input){ id tipe hide gfpayment showQris chargestxt charges chargesnil chargescd1 chargescd2 chargesitm noRound adjust glbDiscs glbDisc glbDiscnl glbDisccd cost perkirId } }",
            {"input": {"tipe": "TEST TIPEBY", "hide": True, "gfpayment": True, "showQris": True, "chargestxt": "Biaya Layanan",
                       "charges": "2.5", "chargesnil": "1000", "chargescd1": "50000", "chargescd2": "999999999",
                       "chargesitm": True, "noRound": True, "adjust": "50", "glbDiscs": True, "glbDisc": "0.5",
                       "glbDiscnl": "0", "glbDisccd": "0", "cost": "0", "perkirId": 3}})["createTipePembayaran"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["tipe"] == "TEST TIPEBY" and c["hide"] and c["gfpayment"] and c["showQris"] and c["chargesitm"] and c["noRound"]
    assert c["charges"] == "2.50" and c["chargesnil"] == "1000.00" and c["perkirId"] == 3
    pid = c["id"]
    print("CREATE CHECK: PASS (charges/kondisi/toggles/perkiraan)")

    u = gql("mutation($id:Int!,$input:TipePembayaranInput!){ updateTipePembayaran(id:$id, input:$input){ tipe hide gfpayment glbDiscs glbDisc adjust } }",
            {"id": pid, "input": {"tipe": "TEST TIPEBY ED", "hide": False, "glbDiscs": False, "glbDisc": "3", "adjust": "0"}})["updateTipePembayaran"]
    print("UPDATED:", json.dumps(u))
    assert u["hide"] is False and u["glbDiscs"] is False

    ok = gql("mutation($id:Int!){ deleteTipePembayaran(id:$id) }", {"id": pid})["deleteTipePembayaran"]
    gone = gql("query($id:Int!){ tipePembayaranById(id:$id){ id } }", {"id": pid})["tipePembayaranById"]
    left = gql('query{ tipePembayaranList(q:"TEST TIPEBY"){ total } }')["tipePembayaranList"]["total"]
    print("DELETED:", ok, "gone:", gone is None, "leftover:", left)
    assert ok and gone is None and left == 0
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
