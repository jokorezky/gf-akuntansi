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
        "no": "TRP-001", "tanggal": "2026-10-13", "vendorId": 1, "gudang": 1,
        "pembelId": None, "pembelId2": None, "noFakpjk": "010.002-26", "tglFakpjk": "2026-10-13",
        "mauang": 1, "kurs": "1.0000", "discNilai": "2000", "ppnTipe": 1, "ppnPers": "11.00",
        "adj01": "0", "termCrd": 30, "catatan": "TEST V2 RETUR",
        "lines": [
            {"stockId": 23916, "jumlah": "2", "harga": "10000"},
            {"stockId": 23917, "jumlah": "1", "harga": "20000", "discPers": "10"},
        ],
    }
    d = gql("mutation($input:ReturPembelianInput!){ createReturPembelian(input:$input){ id no totHarga totDisc ppnNilai lines { stockId nilai } } }", {"input": inp})
    print("CREATED", json.dumps(d["createReturPembelian"], ensure_ascii=False))
    c = d["createReturPembelian"]
    # gross = 2*10000 + 1*20000 = 40000 ; disc baris = 2000 ; + header 2000 = 4000
    # net = 36000 ; ppn 11% = 3960
    assert c["totHarga"] == "40000.00", c["totHarga"]
    assert c["totDisc"] == "4000.00", c["totDisc"]
    assert c["ppnNilai"] == "3960.00", c["ppnNilai"]
    assert c["lines"][1]["nilai"] == "18000.00", c["lines"][1]["nilai"]
    print("MATH CHECK: PASS")

    rid = c["id"]
    d2 = gql("query($id:Int!){ returPembelianById(id:$id){ id no noFakpjk kurs termCrd lines { stockId nilai } } }", {"id": rid})
    print("READ", json.dumps(d2["returPembelianById"], ensure_ascii=False))

    d3 = gql("mutation{ updateReturPembelian(id:%d, input:{no:\"TRP-001-ED\", vendorId:1, ppnPers:\"0\", lines:[{stockId:23916, jumlah:\"1\", harga:\"5000\"}]}){ id no totHarga totDisc } }" % rid)
    print("UPDATED", json.dumps(d3["updateReturPembelian"], ensure_ascii=False))

    d4 = gql("mutation{ deleteReturPembelian(id:%d) }" % rid)
    print("DELETED", d4["deleteReturPembelian"])

    d5 = gql("query{ returPembelianList(q:\"TRP-001\"){ total } }")
    print("leftover:", d5["returPembelianList"]["total"])


if __name__ == "__main__":
    main()
