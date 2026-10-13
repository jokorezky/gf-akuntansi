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
    p = gql("mutation($input:PurchaseInput!){ createPurchase(input:$input){ id no gudang divisiId totHarga } }",
            {"input": {"tanggal": "2026-10-13", "vendorId": 1, "gudang": 6, "divisiId": 6,
                       "catatan": "TEST ANTAR CABANG", "lines": [{"stockId": 23916, "jumlah": "2", "harga": "10000"}]}})["createPurchase"]
    print("PEMBELIAN AC:", json.dumps(p))
    assert p["divisiId"] == 6 and p["gudang"] == 6, "divisiId/gudang pembelian gagal"
    print("PEMBELIAN ANTAR CABANG: PASS (gudang+divisi tersimpan)")

    s = gql("mutation($input:SaleInput!){ createSale(input:$input){ id no gudang divisiId totHarga } }",
            {"input": {"tanggal": "2026-10-13", "pelangId": 2, "gudang": 6, "divisiId": 6,
                       "lines": [{"stockId": 23916, "jumlah": "1", "harga": "75000"}]}})["createSale"]
    print("PENJUALAN AC:", json.dumps(s))
    assert s["divisiId"] == 6, "divisiId penjualan gagal"
    print("PENJUALAN ANTAR CABANG: PASS (divisi tersimpan)")

    d = gql("query($id:Int!){ purchaseById(id:$id){ id gudang divisiId } }", {"id": p["id"]})["purchaseById"]
    print("READ PEMBELIAN:", json.dumps(d))
    assert d["divisiId"] == 6

    gql("mutation($id:Int!){ deletePurchase(id:$id) }", {"id": p["id"]})
    gql("mutation($id:Int!){ deleteSale(id:$id) }", {"id": s["id"]})
    left1 = gql("query{ purchaseList(q:\"TEST ANTAR CABANG\"){ total } }")["purchaseList"]["total"]
    print("CLEANUP leftover:", left1)
    assert left1 == 0
    print("ALL PASS — CRUD bersih")


if __name__ == "__main__":
    main()
