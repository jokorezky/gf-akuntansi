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
    # faktur asal: buat penjualan mini
    s = gql("mutation($input:SaleInput!){ createSale(input:$input){ id no } }",
            {"input": {"tanggal": "2026-10-13", "pelangId": 2, "lines": [{"stockId": 23916, "jumlah": "1", "harga": "75000"}]}})["createSale"]
    print("FAKTUR ASAL:", s)
    inp = {
        "tanggal": "2026-10-13", "pelangId": 2, "gudang": 1, "penjuaId": s["id"], "mauang": 1,
        "discPerst": "10", "discNilai": "1000", "ppnPers": "11", "adj1": "1000", "adj2": "500",
        "catatan": "TEST RJ",
        "lines": [
            {"stockId": 23916, "jumlah": "2", "harga": "75000", "discPers": "10"},
            {"stockId": 23917, "jumlah": "1", "harga": "39000", "discPers2": "5", "jmlRusak": "0.5"},
        ],
    }
    c = gql("mutation($input:ReturPenjualanInput!){ createReturPenjualan(input:$input){ id no penjuaId penjuaNo totHarga totDisc totalNilai totalRetur lines { stockId nilai jmlRusak } } }",
            {"input": inp})["createReturPenjualan"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["totHarga"] == "189000.00", c["totHarga"]
    assert c["totDisc"] == "35155.00", c["totDisc"]
    assert c["totalNilai"] == "152345.00", c["totalNilai"]
    assert c["totalRetur"] == "169102.95", c["totalRetur"]
    assert c["penjuaId"] == s["id"] and c["penjuaNo"] == s["no"], "relasi faktur asal gagal"
    print("MATH CHECK: PASS (berlapis + header disc/adj + PPN)")
    print("RELATION CHECK: PASS (s_retpen.penjua_id -> s_penjua.no =", c["penjuaNo"], ")")
    rid = c["id"]

    d = gql("query($id:Int!){ returPenjualanById(id:$id){ id no penjuaNo lines { stockId nilai jmlRusak } } }", {"id": rid})["returPenjualanById"]
    print("READ:", json.dumps(d, ensure_ascii=False))
    assert len(d["lines"]) == 2 and d["lines"][0]["nilai"] == "135000.00" and d["lines"][1]["nilai"] == "37050.00"
    print("RELATION CHECK: PASS (s_retpen.id <-> s_retpjd.retpen_id, 2 baris; jmlRusak tersimpan)")

    upd = dict(inp)
    upd["lines"] = [{"stockId": 23916, "jumlah": "1", "harga": "75000"}]
    upd["discPerst"] = "0"
    upd["discNilai"] = "0"
    upd["adj1"] = "0"
    upd["adj2"] = "0"
    u = gql("mutation($id:Int!,$input:ReturPenjualanInput!){ updateReturPenjualan(id:$id, input:$input){ totHarga totalRetur lines { stockId } } }",
            {"id": rid, "input": upd})["updateReturPenjualan"]
    print("UPDATED:", json.dumps(u, ensure_ascii=False))
    assert u["totHarga"] == "75000.00" and len(u["lines"]) == 1

    ok = gql("mutation($id:Int!){ deleteReturPenjualan(id:$id) }", {"id": rid})["deleteReturPenjualan"]
    gql("mutation($id:Int!){ deleteSale(id:$id) }", {"id": s["id"]})
    gone = gql("query($id:Int!){ returPenjualanById(id:$id){ id } }", {"id": rid})["returPenjualanById"]
    print("DELETED:", ok, "row terhapus:", gone is None)
    assert ok and gone is None


if __name__ == "__main__":
    main()
