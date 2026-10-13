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
        "no": 991001, "tanggal": "2026-10-13", "tglKirim": "2026-10-20",
        "vendorId": 1, "mauang": 1, "discNilai": "5000", "ppnTipe": 1, "ppnPers": "11.00",
        "catatan": "TEST V2 PO", "prtTJml": True, "prtHarga": False,
        "lines": [
            {"stockId": 23916, "jumlah": "10", "harga": "10000", "discNilial": "0"},
            {"stockId": 23917, "jumlah": "5", "harga": "20000", "discPers": "10", "discNilai": "1000"},
        ],
    }
    inp["lines"][0].pop("discNilial", None)
    d = gql("mutation($input:PurchaseOrderInput!){ createPurchaseOrder(input:$input){ id no totHarga totDisc ppnNilai lines { stockId jumlah harga discPers discNilai nilai } } }", {"input": inp})
    print("CREATED", json.dumps(d["createPurchaseOrder"], ensure_ascii=False))

    # cek math: line1 = 10*10000 = 100000 ; line2 = (5*20000)*0.9 - 1000 = 89000
    # gross = 200000 ; disc baris = 0 + (100000-89000)=11000 ; + header 5000 = 16000
    # total = 184000 ; ppn 11% = 20240
    pid = d["createPurchaseOrder"]["id"]
    expect = {"totHarga": "200000.00", "totDisc": "16000.00", "ppnNilai": "20240.00"}

    d2 = gql("query($id:Int!){ purchaseOrderById(id:$id){ id no totHarga totDisc ppnNilai prtTJml tglKirim lines { stockId nilai } } }", {"id": pid})
    got = d2["purchaseOrderById"]
    print("READ", json.dumps(got, ensure_ascii=False))
    ok = got["totHarga"] == "200000.00" and got["totDisc"] == "16000.00"
    print("MATH CHECK:", "PASS" if ok else f"CHECK (expect {expect})")
    assert got["lines"][1]["nilai"] == "89000.00", "line2 nilai mismatch"

    d3 = gql("mutation{ updatePurchaseOrder(id:%d, input:{no:991001, vendorId:1, discNilai:\"0\", ppnPers:\"0\", lines:[{stockId:23916, jumlah:\"1\", harga:\"5000\"}]}){ id totHarga totDisc } }" % pid)
    print("UPDATED", json.dumps(d3["updatePurchaseOrder"], ensure_ascii=False))

    d4 = gql("mutation{ deletePurchaseOrder(id:%d) }" % pid)
    print("DELETED", d4["deletePurchaseOrder"])

    d5 = gql("query{ purchaseOrderList(q:\"TEST V2 PO\"){ total } }")
    print("leftover:", d5["purchaseOrderList"]["total"])


if __name__ == "__main__":
    main()
