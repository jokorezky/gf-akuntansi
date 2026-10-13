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
    # ambil 1 hutang outstanding utk referensi
    dh = gql("query{ daftarHutangList { total rows { id no sisa } } }")
    print("daftarHutang total:", dh["daftarHutangList"]["total"])
    ref = dh["daftarHutangList"]["rows"][0] if dh["daftarHutangList"]["rows"] else None
    print("ref:", ref)

    inp = {"no": "TPH-001", "tanggal": "2026-10-13", "vendorId": 1, "divisiId": None,
           "catatan": "TEST V2 BAYAR HUTANG",
           "lines": [
               {"pembelId": ref["id"] if ref else None, "lunas": "100000", "discount": "5000", "denda": "0", "catatan": "line1"},
               {"pembelId": None, "lunas": "25000", "discount": "0", "denda": "1000", "catatan": "line2"},
           ]}
    d = gql("mutation($input:PaymentInput!){ createPayment(input:$input){ id no total discTotal lines { pembelId lunas discount denda no invTotal } } }", {"input": inp})
    print("CREATED", json.dumps(d["createPayment"], ensure_ascii=False))
    c = d["createPayment"]
    assert c["total"] == "125000.00", c["total"]
    assert c["discTotal"] == "5000.00", c["discTotal"]
    if ref:
        assert c["lines"][0]["invTotal"], "invTotal harus ter-resolve dari pembelian"
    print("MATH CHECK: PASS")

    pid = c["id"]
    d2 = gql("query($id:Int!){ paymentById(id:$id){ id no catatan lines { pembelId no lunas } } }", {"id": pid})
    print("READ", json.dumps(d2["paymentById"], ensure_ascii=False))

    d3 = gql("mutation{ updatePayment(id:%d, input:{no:\"TPH-001-ED\", vendorId:1, lines:[{lunas:\"50000\"}]}){ id no total } }" % pid)
    print("UPDATED", json.dumps(d3["updatePayment"], ensure_ascii=False))

    d4 = gql("mutation{ deletePayment(id:%d) }" % pid)
    print("DELETED", d4["deletePayment"])

    d5 = gql("query{ paymentList(q:\"TPH-001\"){ total } }")
    print("leftover:", d5["paymentList"]["total"])


if __name__ == "__main__":
    main()
