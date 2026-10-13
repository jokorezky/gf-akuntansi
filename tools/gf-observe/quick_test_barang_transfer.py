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
    c = gql("mutation($input:BarangTransferInput!){ createBarangTransfer(input:$input){ id tanggal divisiId gudang nilai1 nilai2 nilai3 totHarga totJumlah lines { stockId jumlah harga } } }",
            {"input": {"tanggal": "2026-10-13", "divisiId": 6, "gudang": 6,
                       "nilai1": "1000", "nilai2": "500", "catatan": "TEST BARANG TRANSFER",
                       "lines": [{"stockId": 23916, "jumlah": "2", "harga": "75000"}, {"stockId": 23917, "jumlah": "1", "harga": "39000"}]}})["createBarangTransfer"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["totHarga"] == "189000.00" and c["totJumlah"] == "3", c
    assert c["nilai1"] == "1000.00" and c["nilai2"] == "500.00"
    assert len(c["lines"]) == 2
    print("LOGIC CHECK: PASS (tot = sum jumlah*harga; cost nilai1/2 tersimpan)")
    pid = c["id"]

    d = gql("query($id:Int!){ barangTransferById(id:$id){ id lines { stockId jumlah harga } } }", {"id": pid})["barangTransferById"]
    print("READ:", json.dumps(d, ensure_ascii=False))
    assert len(d["lines"]) == 2
    print("RELASI s_trmstk.id <-> s_trmsex.trmstk_id: PASS (2 baris)")

    s = gql("query($id:Int!){ trfSisaStock(stockId:$id){ stockId nama sisa } }", {"id": 23916})["trfSisaStock"]
    print("SISA STOCK:", json.dumps(s, ensure_ascii=False))

    u = gql("mutation($id:Int!,$input:BarangTransferInput!){ updateBarangTransfer(id:$id, input:$input){ totHarga totJumlah lines { stockId } } }",
            {"id": pid, "input": {"tanggal": "2026-10-13", "divisiId": 6, "gudang": 6, "nilai1": "0", "nilai2": "0", "nilai3": "0",
                                  "lines": [{"stockId": 23916, "jumlah": "1", "harga": "75000"}]}})["updateBarangTransfer"]
    print("UPDATED:", json.dumps(u, ensure_ascii=False))
    assert u["totHarga"] == "75000.00" and len(u["lines"]) == 1

    ok = gql("mutation($id:Int!){ deleteBarangTransfer(id:$id) }", {"id": pid})["deleteBarangTransfer"]
    gone = gql("query($id:Int!){ barangTransferById(id:$id){ id } }", {"id": pid})["barangTransferById"]
    left = gql("query{ barangTransferList(q:\"TEST BARANG TRANSFER\"){ total } }")["barangTransferList"]["total"]
    print("DELETED:", ok, "gone:", gone is None, "leftover:", left)
    assert ok and gone is None
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
