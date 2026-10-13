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
        "tanggal": "2026-10-13", "pelangId": 1, "gudang": 1, "po": "PO-EXT-01",
        "salesKom": "2.50", "mauang": 1, "kurs": "1.0000", "discNilai": "5000",
        "ppnTipe": 1, "ppnPers": "11.00", "deposit": "10000", "termCrd": 14,
        "noPjk": 100326, "noPjkSr": 9001, "tglPajak": "2026-10-13", "kursPajak": "1.0000",
        "catatan": "TEST V2 PENJUALAN",
        "lines": [
            {"stockId": 23916, "jumlah": "10", "harga": "10000", "bonus": "1"},
            {"stockId": 23917, "jumlah": "5", "harga": "20000", "discPers": "10", "discNilai": "1000"},
        ],
    }
    d = gql("mutation($input:SaleInput!){ createSale(input:$input){ id no totHarga totDisc ppnNilai noPjk salesKom lines { stockId jumlah bonus nilai } } }", {"input": inp})
    print("CREATED", json.dumps(d["createSale"], ensure_ascii=False))
    c = d["createSale"]
    assert c["totHarga"] == "200000.00", c["totHarga"]
    assert c["totDisc"] == "16000.00", c["totDisc"]
    assert c["ppnNilai"] == "20240.00", c["ppnNilai"]
    assert c["lines"][1]["nilai"] == "89000.00", c["lines"][1]["nilai"]
    print("MATH CHECK: PASS")

    sid = c["id"]
    d2 = gql("query($id:Int!){ saleById(id:$id){ id no po salesKom noPjk noPjkSr lunas lines { stockId bonus nilai } } }", {"id": sid})
    print("READ", json.dumps(d2["saleById"], ensure_ascii=False))

    d3 = gql("mutation{ updateSale(id:%d, input:{pelangId:1, po:\"PO-EXT-01-ED\", ppnPers:\"0\", lines:[{stockId:23916, jumlah:\"1\", harga:\"5000\"}]}){ id no totHarga totDisc } }" % sid)
    print("UPDATED", json.dumps(d3["updateSale"], ensure_ascii=False))

    d4 = gql("mutation{ deleteSale(id:%d) }" % sid)
    print("DELETED", d4["deleteSale"])

    d5 = gql("query{ saleList(q:\"TEST\"){ total } }")
    print("leftover:", d5["saleList"]["total"])


if __name__ == "__main__":
    main()
