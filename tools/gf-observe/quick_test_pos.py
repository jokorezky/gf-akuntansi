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
    k = gql("query{ posKatalog(q:\"Lightening Serum 30\", limit:10){ id nama hargaJ1 disc1J1 } }")["posKatalog"]
    print("KATALOG:", json.dumps(k[:3], ensure_ascii=False))
    assert any(x["id"] == 23916 and x["hargaJ1"] == "75000.00" for x in k), "katalog harga salah"
    print("KATALOG CHECK: PASS")

    inp = {
        "tanggal": "2026-10-13", "pelangId": 2, "gudang": 1, "mauang": 1,
        "no": "EC-TEST", "discPers": "10", "discNilai": "5000",
        "adj1Pers": "1", "adj1Nilai": "1000",
        "catatan": "TEST V2 POS",
        "lines": [
            {"stockId": 23916, "jumlah": "2", "harga": "75000", "discPers": "10"},
            {"stockId": 23917, "jumlah": "3", "harga": "39000", "discPers": "5", "discPers2": "2", "ppnPers": "11"},
        ],
    }
    c = gql("mutation($input:PosInput!){ createPos(input:$input){ id no subTotal totDisc total totalQty lines { stockId jumlah harga discPers discPers2 ppnPers ppnNilai nilai } } }",
            {"input": inp})["createPos"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["subTotal"] == "243927.00", c["subTotal"]
    assert c["totDisc"] == "52465.70", c["totDisc"]
    assert c["total"] == "223370.93", c["total"]
    assert c["totalQty"] == "5", c["totalQty"]
    assert c["lines"][1]["nilai"] == "108927.00", c["lines"][1]
    assert c["lines"][1]["ppnNilai"] == "11981.97", c["lines"][1]
    print("MATH CHECK: PASS (disc 3 lapis + PPN baris + disc/adj header)")
    pid = c["id"]

    d = gql("query($id:Int!){ posById(id:$id){ id no pelNama subTotal total lines { stockId nilai satuanC } } }", {"id": pid})["posById"]
    print("READ:", json.dumps(d, ensure_ascii=False))
    assert len(d["lines"]) == 2, "relasi ecrlst_id -> s_penecr gagal (baris tidak tersimpan)"
    print("RELATION CHECK: PASS (s_ecrlst.id <-> s_penecr.ecrlst_id, 2 baris)")

    upd = dict(inp)
    upd["no"] = "EC-TEST-ED"
    upd["lines"] = [{"stockId": 23916, "jumlah": "1", "harga": "75000", "discPers": "0"}]
    u = gql("mutation($id:Int!,$input:PosInput!){ updatePos(id:$id, input:$input){ no subTotal total lines { stockId nilai } } }",
            {"id": pid, "input": upd})["updatePos"]
    print("UPDATED:", json.dumps(u, ensure_ascii=False))
    assert u["subTotal"] == "75000.00" and len(u["lines"]) == 1

    ok = gql("mutation($id:Int!){ deletePos(id:$id) }", {"id": pid})["deletePos"]
    left = gql("query{ posList(q:\"EC-TEST\"){ total } }")["posList"]["total"]
    print("DELETED:", ok, "leftover:", left)
    assert ok and left == 0


if __name__ == "__main__":
    main()
