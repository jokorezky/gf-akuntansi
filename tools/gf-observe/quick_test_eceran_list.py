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
    l = gql("query{ eceranListList{ total rows { id list hitungan hargaJual itemNama harga1 harga2 } } }")["eceranListList"]
    print("LIST total:", l["total"], json.dumps(l["rows"][:3], ensure_ascii=False))
    assert any(r["list"] == "EC001" for r in l["rows"]), "preset EC001 tidak tampil"
    print("LIST CHECK: PASS (preset sts_ecr NULL; EC001 tampil)")

    c = gql("mutation($input:EceranListInput!){ createEceranList(input:$input){ id list kelompok2 hitungan hargaJual itemId itemNama harga1 harga2 harga3 harga4 harga5 pabxExt keyRoom keyLift defOut hide } }",
            {"input": {"list": "TEST ECL", "kelompok": None, "hitungan": 3, "hargaJual": 1,
                       "itemId": 23916, "harga1": "10000", "harga2": "11000", "harga3": "12000", "harga4": "13000", "harga5": "14000",
                       "pabxExt": "101", "keyRoom": "K1", "keyLift": "L1", "defOut": "OUT", "hide": False}})["createEceranList"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["list"] == "TEST ECL" and c["hitungan"] == 3 and c["hargaJual"] == 1
    assert c["itemNama"] == "Wardah Lightening Serum 30ml" and c["harga5"] == "14000"
    assert c["pabxExt"] == "101" and c["keyRoom"] == "K1"
    pid = c["id"]
    print("CREATE CHECK: PASS (harga*1-5, #Item relasi s_stock, key room/lift/pabx)")

    u = gql("mutation($id:Int!,$input:EceranListInput!){ updateEceranList(id:$id, input:$input){ list harga1 hide hitungan } }",
            {"id": pid, "input": {"list": "TEST ECL ED", "harga1": "9999", "hide": True, "hitungan": 5,
                                  "harga2": "0", "harga3": "0", "harga4": "0", "harga5": "0"}})["updateEceranList"]
    print("UPDATED:", json.dumps(u))
    assert u["list"] == "TEST ECL ED" and u["harga1"] == "9999" and u["hide"] is True

    ok = gql("mutation($id:Int!){ deleteEceranList(id:$id) }", {"id": pid})["deleteEceranList"]
    gone = gql("query($id:Int!){ eceranListById(id:$id){ id } }", {"id": pid})["eceranListById"]
    sisa = gql('query{ eceranListList(q:"TEST ECL"){ rows { id } } }')["eceranListList"]["rows"]
    for r in sisa:
        gql("mutation($id:Int!){ deleteEceranList(id:$id) }", {"id": r["id"]})
    left = gql('query{ eceranListList(q:"TEST ECL"){ total } }')["eceranListList"]["total"]
    print("DELETED:", ok, "gone:", gone is None, "cleanup-extra:", len(sisa), "leftover:", left)
    assert ok and gone is None and left == 0
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
