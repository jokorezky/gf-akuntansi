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
    c = gql("mutation($input:BarangPindahGudangInput!){ createBarangPindahGudang(input:$input){ id no tanggal divisiId nama gudang1 gudang2 totJumlah lines { stockId stockGdg stockGdg2 jumlah } } }",
            {"input": {"tanggal": "2026-10-13", "divisiId": 6, "nama": "TEST TUJUAN", "gudang1": 6, "gudang2": 1,
                       "catatan": "TEST PINDAH GUDANG",
                       "lines": [{"stockId": 23916, "jumlah": "2"}, {"stockId": 23917, "jumlah": "3"}]}})["createBarangPindahGudang"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["no"] and c["totJumlah"] == "5.000" and len(c["lines"]) == 2
    assert c["lines"][0]["stockGdg"] == 6 and c["lines"][0]["stockGdg2"] == 1
    print("LOGIC CHECK: PASS (no auto, total jumlah 5, gudang dr/ke keturun header)")
    pid = c["id"]

    d = gql("query($id:Int!){ barangPindahGudangById(id:$id){ id no lines { stockId stockGdg stockGdg2 jumlah } } }", {"id": pid})["barangPindahGudangById"]
    print("READ:", json.dumps(d, ensure_ascii=False))
    assert len(d["lines"]) == 2
    print("RELASI s_stkpin.id <-> s_stkpex.stkpin_id: PASS (2 baris)")

    tot = gql("query{ barangPindahGudangList(q:\"TEST PINDAH GUDANG\"){ total } }")["barangPindahGudangList"]["total"]
    print("LIST CARI:", tot)
    assert tot >= 1

    u = gql("mutation($id:Int!,$input:BarangPindahGudangInput!){ updateBarangPindahGudang(id:$id, input:$input){ totJumlah lines { stockId } } }",
            {"id": pid, "input": {"tanggal": "2026-10-13", "divisiId": 6, "gudang1": 6, "gudang2": 1,
                                  "lines": [{"stockId": 23916, "jumlah": "1"}]}})["updateBarangPindahGudang"]
    print("UPDATED:", json.dumps(u))
    assert u["totJumlah"] == "1.000" and len(u["lines"]) == 1

    ok = gql("mutation($id:Int!){ deleteBarangPindahGudang(id:$id) }", {"id": pid})["deleteBarangPindahGudang"]
    gone = gql("query($id:Int!){ barangPindahGudangById(id:$id){ id } }", {"id": pid})["barangPindahGudangById"]
    print("DELETED:", ok, "gone:", gone is None)
    assert ok and gone is None
    sisa = gql("query{ barangPindahGudangList(q:\"TEST PINDAH GUDANG\"){ rows { id } } }")["barangPindahGudangList"]["rows"]
    for r in sisa:
        gql("mutation($id:Int!){ deleteBarangPindahGudang(id:$id) }", {"id": r["id"]})
    left = gql("query{ barangPindahGudangList(q:\"TEST PINDAH GUDANG\"){ total } }")["barangPindahGudangList"]["total"]
    print("leftover dibersihkan:", len(sisa), "->", left)
    assert left == 0
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
