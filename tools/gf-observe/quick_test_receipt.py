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


def piutang_of(pid, solo=False):
    rows = gql("query{ daftarPiutangList(limit:500){ rows { id no pelangId total dibayar retur sisa } } }")["daftarPiutangList"]["rows"]
    for r in rows:
        if r["id"] == solo:
            return r
    return None


def main():
    s = gql("mutation($input:SaleInput!){ createSale(input:$input){ id no totHarga } }",
            {"input": {"tanggal": "2026-10-13", "pelangId": 15, "lines": [{"stockId": 23916, "jumlah": "1", "harga": "200000"}]}})["createSale"]
    print("NOTA:", s)
    inv = None
    try:
        rows = gql("query{ daftarPiutangList(limit:500){ rows { id no pelangId total dibayar retur sisa } } }")["daftarPiutangList"]["rows"]
        inv = next(r for r in rows if r["id"] == s["id"])
        print("PIUTANG AWAL:", json.dumps(inv, ensure_ascii=False))
        assert inv["dibayar"] == "0" and inv["sisa"] == "200000.00", inv
    except StopIteration:
        print("PIUTANG AWAL: tidak ada (sale baru)")

    c = gql("mutation($input:ReceiptInput!){ createReceipt(input:$input){ id no totalLunas total totalDisc totalDenda lines { penjuaId penjuaNo lunas } } }",
            {"input": {"tanggal": "2026-10-13", "pelangId": 15, "collector": 3, "catatan": "TEST RECEIPT",
                       "lines": [{"penjuaId": s["id"], "lunas": "200000"}]}})["createReceipt"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["totalLunas"] == "200000.00" and c["total"] == "200000.00"
    assert c["lines"][0]["penjuaNo"] == s["no"], "relasi nota (penjua_id) gagal"
    print("RELATION CHECK: PASS (s_lunpen.penjua_id -> s_penjua.no =", c["lines"][0]["penjuaNo"], ")")
    rid = c["id"]

    d = gql("query($id:Int!){ receiptById(id:$id){ id no collector lines { penjuaId penjuaNo lunas discount denda } } }", {"id": rid})["receiptById"]
    print("READ:", json.dumps(d, ensure_ascii=False))
    assert len(d["lines"]) == 1
    print("RELATION CHECK: PASS (s_lpenma.id <-> s_lunpen.lpenma_id)")

    inv2 = next(r for r in gql("query{ daftarPiutangList(limit:500){ rows { id dibayar sisa } } }")["daftarPiutangList"]["rows"] if r["id"] == s["id"])
    print("PIUTANG SETELAH TERIMA:", json.dumps(inv2))
    assert inv2["dibayar"] == "200000.00" and inv2["sisa"] == "0.00", inv2
    print("DAFTAR PIUTANG CHECK: PASS (dibayar 200000, sisa 0)")

    u = gql("mutation($id:Int!,$input:ReceiptInput!){ updateReceipt(id:$id, input:$input){ total totalLunas } }",
            {"id": rid, "input": {"tanggal": "2026-10-13", "pelangId": 15, "collector": 3, "lines": [{"penjuaId": s["id"], "lunas": "120000", "discount": "10000", "denda": "500"}]}})["updateReceipt"]
    print("UPDATED:", json.dumps(u))
    assert u["totalLunas"] == "120000.00" and u["total"] == "110500.00"
    inv3 = next(r for r in gql("query{ daftarPiutangList(limit:500){ rows { id dibayar sisa } } }")["daftarPiutangList"]["rows"] if r["id"] == s["id"])
    print("PIUTANG SETELAH UPDATE:", json.dumps(inv3))
    assert inv3["dibayar"] == "110500.00" and inv3["sisa"] == "89500.00", inv3
    print("DAFTAR PIUTANG CHECK: PASS (dibayar 110500 = 120000-10000+500)")

    ok = gql("mutation($id:Int!){ deleteReceipt(id:$id) }", {"id": rid})["deleteReceipt"]
    inv4 = next(r for r in gql("query{ daftarPiutangList(limit:500){ rows { id dibayar sisa } } }")["daftarPiutangList"]["rows"] if r["id"] == s["id"])
    print("SETELAH HAPUS:", json.dumps(inv4))
    assert ok and inv4["dibayar"] == "0" and inv4["sisa"] == "200000.00", inv4
    print("REVERSAL CHECK: PASS (hapus receipt -> dibayar balik 0)")
    gql("mutation($id:Int!){ deleteSale(id:$id) }", {"id": s["id"]})
    print("CLEANUP OK")


if __name__ == "__main__":
    main()
