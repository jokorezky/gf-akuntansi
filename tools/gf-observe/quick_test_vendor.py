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
    d = gql(
        "mutation($input:VendorInput!){ createVendor(input:$input){ id nama pbCash pbCredit userLvl catatan2 hubungi2 hubTelp2 muBeli maxCrd2 ppnPersex } }",
        {"input": {"nama": "TEST V2 VENDOR", "alamat": "Jl Uji", "pbCash": True, "pbCredit": True,
                   "userLvl": "3", "catatan2": "memo dua", "catatan3": "memo tiga", "hubungi2": "Pak Uji",
                   "hubTelp2": "0813", "muBeli": 1, "maxCrd2": "0", "max3Crd": "0", "ppnPersex": "11.00",
                   "ppnTipe": 1, "updateMf": 0, "catShow": True}})
    vid = d["createVendor"]["id"]
    print("CREATED", json.dumps(d["createVendor"]))

    q2 = "mutation{ updateVendor(id:%d, input:{nama:\"TEST V2 VENDOR ED\", pbCash:false, userLvl:\"5\", catatan2:\"memo dua ED\"}){ id nama pbCash userLvl catatan2 } }" % vid
    d2 = gql(q2)
    print("UPDATED", json.dumps(d2["updateVendor"]))

    d3 = gql("mutation{ deleteVendor(id:%d) }" % vid)
    print("DELETED", d3["deleteVendor"])

    d4 = gql("query{ vendorList(q:\"TEST V2\"){ total } }")
    print("leftover TEST:", d4["vendorList"]["total"])


if __name__ == "__main__":
    main()
