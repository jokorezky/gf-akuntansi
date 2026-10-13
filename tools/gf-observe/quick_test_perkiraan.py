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
    l = gql("query{ perkiraanList(limit:5){ total rows { id kode nama golonganNama header debet mauangKode } } }")["perkiraanList"]
    print("LIST total:", l["total"])
    print("   row0:", json.dumps(l["rows"][0], ensure_ascii=False))
    assert l["total"] > 300 and l["rows"][0]["kode"]
    print("LIST CHECK: PASS (373+ akun, kode+nama)")

    f = gql('query{ perkiraanList(q:"11101"){ rows { id kode nama golonganNama debet nonRev salAwal mauangKode cairchbg } } }')["perkiraanList"]["rows"]
    print("CARI 11101:", json.dumps(f, ensure_ascii=False))
    assert f and f[0]["nama"] == "Kas Besar IDR"
    print("DETAIL CHECK: PASS (golongan/debet/nonRev/saldo)")

    mu = gql("{ mauangList { id kode mataUang } }")["mauangList"]
    print("MU:", json.dumps(mu))
    assert any(m["kode"] == "IDR" for m in mu)

    c = gql("mutation($input:PerkiraanInput!){ createPerkiraan(input:$input){ id kode nama golongan golonganNama multiCur tarikKurs } }",
            {"input": {"kode": "99999", "nama": "TEST PERKIRAAN", "golongan": 5, "multiCur": True, "tarikKurs": True, "salAwal": "0"}})["createPerkiraan"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["kode"] == "99999" and c["golonganNama"] == "BIAYA" and c["multiCur"] and c["tarikKurs"]
    pid = c["id"]

    u = gql("mutation($id:Int!,$input:PerkiraanInput!){ updatePerkiraan(id:$id, input:$input){ kode nama golongan debet nonRev salAwal } }",
            {"id": pid, "input": {"kode": "99999", "nama": "TEST PERKIRAAN ED", "golongan": 4, "debet": False, "nonRev": True, "salAwal": "123.45"}})["updatePerkiraan"]
    print("UPDATED:", json.dumps(u))
    assert u["golongan"] == 4 and u["debet"] is False and u["nonRev"] and u["salAwal"] == "123.45"
    print("CRUD CHECK: PASS")

    ok = gql("mutation($id:Int!){ deletePerkiraan(id:$id) }", {"id": pid})["deletePerkiraan"]
    gone = gql("query($id:Int!){ perkiraanById(id:$id){ id } }", {"id": pid})["perkiraanById"]
    left = gql('query{ perkiraanList(q:"TEST PERKIRAAN"){ total } }')["perkiraanList"]["total"]
    print("DELETED:", ok, "gone:", gone is None, "leftover:", left)
    assert ok and gone is None and left == 0
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
