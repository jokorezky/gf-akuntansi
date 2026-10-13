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
    inp = {
        "tanggal": "2026-10-13", "tglKirim": "2026-10-20", "tglTutup": "", "pelangId": 1,
        "po": "PO-SO-01", "mauang": 1, "discNilai": "5000", "ppnTipe": 1, "ppnPers": "11.00",
        "catatan": "TEST V2 SO",
        "lines": [
            {"stockId": 23916, "jumlah": "10", "harga": "10000", "bonus": "1"},
            {"stockId": 23917, "jumlah": "5", "harga": "20000", "discPers": "10", "discNilai": "1000"},
        ],
    }
    d = gql("mutation($input:SalesOrderInput!){ createSalesOrder(input:$input){ id no totHarga totDisc ppnNilai tglKirim lines { stockId bonus nilai } } }", {"input": inp})
    print("CREATED", json.dumps(d["createSalesOrder"], ensure_ascii=False))
    c = d["createSalesOrder"]
    assert c["totHarga"] == "200000.00" and c["totDisc"] == "16000.00" and c["ppnNilai"] == "20240.00", c
    print("MATH CHECK: PASS")
    soid = c["id"]

    # relasi: buat Penjualan dengan salordId = SO ini
    sd = gql("mutation($input:SaleInput!){ createSale(input:$input){ id no } }",
             {"input": {"tanggal": "2026-10-13", "pelangId": 1, "salordId": soid, "lines": [{"stockId": 23916, "jumlah": "1", "harga": "10000"}]}})
    sale_id = sd["createSale"]["id"]
    sale_no = sd["createSale"]["no"]
    print("SALE-REL", json.dumps(sd["createSale"], ensure_ascii=False))

    d2 = gql("query($id:Int!){ salesOrderById(id:$id){ id no po penjuaId penjuaNo lines { stockId toexRec nilai } } }", {"id": soid})
    print("READ", json.dumps(d2["salesOrderById"], ensure_ascii=False))
    assert d2["salesOrderById"]["penjuaId"] == sale_id, "relasi penjua_id gagal"
    assert d2["salesOrderById"]["penjuaNo"] == sale_no, "relasi penjua_no gagal"
    print("RELATION CHECK: PASS (salord.penjua_id <-> penjua.salord_id)")

    # cleanup
    gql("mutation{ deleteSale(id:%d) }" % sale_id)
    d4 = gql("mutation{ deleteSalesOrder(id:%d) }" % soid)
    print("DELETED SO:", d4["deleteSalesOrder"])
    d5 = gql("query{ salesOrderList(q:\"TEST\"){ total } }")
    print("leftover:", d5["salesOrderList"]["total"])


if __name__ == "__main__":
    main()
