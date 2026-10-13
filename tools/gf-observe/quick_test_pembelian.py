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
        "no": "TPB-001", "tanggal": "2026-10-13", "tanggal2": "2026-10-20",
        "vendorId": 1, "gudang": 1, "noFakpjk": "010.001-26", "tglFakpjk": "2026-10-13",
        "mauang": 1, "kurs": "1.0000", "discNilai": "5000", "ppnTipe": 1, "ppnPers": "11.00",
        "deposit": "10000", "termCrd": 30, "catatan": "TEST V2 PEMBELIAN",
        "adj01": "1000", "adj02": "0", "adj03": "0", "adj04": "0", "adj05": "0",
        "lines": [
            {"stockId": 23916, "jumlah": "10", "harga": "10000"},
            {"stockId": 23917, "jumlah": "5", "harga": "20000", "discPers": "10", "discNilai": "1000", "expired": "2027-01-01"},
        ],
    }
    d = gql("mutation($input:PurchaseInput!){ createPurchase(input:$input){ id no totHarga totDisc ppnNilai deposit totRetur adj01 lines { stockId nilai discPers discNilai expired } } }", {"input": inp})
    print("CREATED", json.dumps(d["createPurchase"], ensure_ascii=False))
    pid = d["createPurchase"]["id"]
    c = d["createPurchase"]
    assert c["totHarga"] == "200000.00", c["totHarga"]
    assert c["totDisc"] == "16000.00", c["totDisc"]
    assert c["ppnNilai"] == "20240.00", c["ppnNilai"]
    assert c["lines"][1]["nilai"] == "89000.00", c["lines"][1]["nilai"]
    print("MATH CHECK: PASS")

    d2 = gql("query($id:Int!){ purchaseById(id:$id){ id no noFakpjk kurs termCrd adj01 lines { stockId nilai } } }", {"id": pid})
    print("READ", json.dumps(d2["purchaseById"], ensure_ascii=False))

    d3 = gql("mutation{ updatePurchase(id:%d, input:{no:\"TPB-001-ED\", vendorId:1, ppnPers:\"0\", lines:[{stockId:23916, jumlah:\"1\", harga:\"5000\"}]}){ id no totHarga totDisc } }" % pid)
    print("UPDATED", json.dumps(d3["updatePurchase"], ensure_ascii=False))

    d4 = gql("mutation{ deletePurchase(id:%d) }" % pid)
    print("DELETED", d4["deletePurchase"])

    d5 = gql("query{ purchaseList(q:\"TPB-001\"){ total } }")
    print("leftover:", d5["purchaseList"]["total"])


if __name__ == "__main__":
    main()
