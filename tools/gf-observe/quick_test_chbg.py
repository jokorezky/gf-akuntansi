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


ROWS = """query($tipe:String!,$q:String,$status:String,$limit:Int){ chbgList(tipe:$tipe, q:$q, status:$status, limit:$limit){ total totalNilai rows { sysId dbCr no tanggal nilai nilai3 perkirNama lunasCair lunasCairKe cairchbg vendorNama pelangNama } } }"""


def main():
    m = gql(ROWS, {"tipe": "masuk", "limit": 5})["chbgList"]
    print("MASUK total:", m["total"], "nilai:", m["totalNilai"])
    print("   row0:", json.dumps(m["rows"][0], ensure_ascii=False) if m["rows"] else None)
    assert m["total"] > 0 and m["rows"][0]["dbCr"] in ("DB", "CR")
    k = gql(ROWS, {"tipe": "keluar", "limit": 5})["chbgList"]
    print("KELUAR total:", k["total"], "nilai:", k["totalNilai"])
    assert k["total"] > 0
    print("LIST CHECK: PASS (masuk + keluar)")

    q174 = gql(ROWS, {"tipe": "masuk", "q": "000000000000174", "limit": 5})["chbgList"]
    print("CARI 174:", len(q174["rows"]), "baris")
    assert any(r["no"] == "000000000000174" for r in q174["rows"]), "cari no gagal"
    print("CARI CHECK: PASS (no tercari)")

    v = gql("query{ chbgVendorRef { id nama alamat } }")["chbgVendorRef"]
    p = gql("query{ chbgPelangganRef { id nama alamat daerahNama } }")["chbgPelangganRef"]
    print("VENDOR ref:", len(v), "| PELANGGAN ref:", len(p))
    assert len(v) > 0 and len(p) > 0
    print("PANEL REF CHECK: PASS")

    row = next(r for r in q174["rows"] if r["no"] == "000000000000174")
    sid = row["sysId"]
    assert not row["cairchbg"]
    n = gql("mutation($tipe:String!,$ids:[Int!]!,$tgl:String,$catatan:String){ chbgCairkan(tipe:$tipe, ids:$ids, tgl:$tgl, catatan:$catatan) }",
            {"tipe": "masuk", "ids": [sid], "tgl": "2026-10-13", "catatan": "TEST CAIR"})["chbgCairkan"]
    print("CAIRKAN:", n)
    after = next(r for r in gql(ROWS, {"tipe": "masuk", "q": "000000000000174", "limit": 5})["chbgList"]["rows"] if r["sysId"] == sid)
    print("   after:", json.dumps(after, ensure_ascii=False))
    assert after["cairchbg"] and after["lunasCair"] == "2026-10-13" and after["lunasCairKe"] == "TEST CAIR"
    print("CAIRKAN CHECK: PASS (cairchbg + Tgl Cair + Catatan)")
    st = gql(ROWS, {"tipe": "masuk", "status": "sudah", "limit": 5})["chbgList"]
    assert any(r["sysId"] == sid for r in st["rows"]), "status sudah gagal"
    stb = gql(ROWS, {"tipe": "masuk", "status": "belum", "limit": 5})["chbgList"]
    assert not any(r["sysId"] == sid for r in stb["rows"]), "status belum gagal"
    print("STATUS FILTER CHECK: PASS (belum/sudah)")

    b = gql("mutation($tipe:String!,$ids:[Int!]!){ chbgBatalCair(tipe:$tipe, ids:$ids) }", {"tipe": "masuk", "ids": [sid]})["chbgBatalCair"]
    back = next(r for r in gql(ROWS, {"tipe": "masuk", "q": "000000000000174", "limit": 5})["chbgList"]["rows"] if r["sysId"] == sid)
    print("BATAL CAIR:", b, "-> kembali:", back["cairchbg"], back["lunasCair"], back["lunasCairKe"])
    assert b == 1 and not back["cairchbg"] and back["lunasCair"] is None
    print("CLEANUP CHECK: PASS (data uji dikembalikan, tidak ada perubahan permanen)")


if __name__ == "__main__":
    main()
