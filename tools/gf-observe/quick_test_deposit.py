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
    inp = {"no": "TDEP-001", "tanggal": "2026-10-13", "vendorId": 1, "divisiId": None,
           "purcorId": None, "pembelId": None, "perkirId": 1, "mauang": 1, "kurs": "1.0000",
           "deposit": "150000", "catatan": "TEST V2 DEPOSIT", "catatan2": "cat2", "catatan3": "cat3"}
    d = gql("mutation($input:DepositPembelianInput!){ createDepositPembelian(input:$input){ id no deposit perkirId perkirNama kurs catatan2 } }", {"input": inp})
    print("CREATED", json.dumps(d["createDepositPembelian"], ensure_ascii=False))
    rid = d["createDepositPembelian"]["id"]
    assert d["createDepositPembelian"]["deposit"] == "150000.00"
    assert d["createDepositPembelian"]["perkirNama"], "perkirNama harus terisi"

    d2 = gql("query($id:Int!){ depositPembelianById(id:$id){ id no deposit kurs catatan2 catatan3 perkirNama } }", {"id": rid})
    print("READ", json.dumps(d2["depositPembelianById"], ensure_ascii=False))

    d3 = gql("mutation{ updateDepositPembelian(id:%d, input:{no:\"TDEP-001-ED\", vendorId:1, deposit:\"200000\"}){ id no deposit } }" % rid)
    print("UPDATED", json.dumps(d3["updateDepositPembelian"], ensure_ascii=False))

    d4 = gql("mutation{ deleteDepositPembelian(id:%d) }" % rid)
    print("DELETED", d4["deleteDepositPembelian"])

    d5 = gql("query{ depositPembelianList(q:\"TDEP-001\"){ total } }")
    print("leftover:", d5["depositPembelianList"]["total"])


if __name__ == "__main__":
    main()
