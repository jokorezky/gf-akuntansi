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
        "mutation($input:ItemInput!){ createItem(input:$input){ id nama kode satEcr kursJual hargaJual1 minJual satJ01 } }",
        {"input": {"nama": "TEST V2 ITEM", "nama2": "Alias Uji", "jenis": 0, "hargaBeli": "5000.00",
                   "hargaJual1": "9000.00", "minStock": "2", "satDef": 1, "satEcr": 1, "kursJual": 1,
                   "satBeli": 1, "satMin": 1, "minJual": "1000.00", "minJlSt": 1,
                   "satJ01": 1, "satJ02": 1, "satJ03": 1, "satJ04": 1, "satJ05": 1,
                   "barcode": "TVI001", "expired": False}})
    iid = d["createItem"]["id"]
    print("CREATED", json.dumps(d["createItem"], ensure_ascii=False))

    d2 = gql("query($id:Int!){ itemById(id:$id){ id nama nama2 hargaBeli hargaJual1 minStock satEcr kursJual minJual satJ01 } }", {"id": iid})
    print("READ", json.dumps(d2["itemById"], ensure_ascii=False))

    d3 = gql("mutation{ updateItem(id:%d, input:{nama:\"TEST V2 ITEM ED\", hargaJual1:\"9500.00\", minStock:\"3\"}){ id nama hargaJual1 minStock } }" % iid)
    print("UPDATED", json.dumps(d3["updateItem"], ensure_ascii=False))

    d4 = gql("mutation{ deleteItem(id:%d) }" % iid)
    print("DELETED", d4["deleteItem"])

    d5 = gql("query{ itemList(q:\"TEST V2\"){ total } }")
    print("leftover:", d5["itemList"]["total"])


if __name__ == "__main__":
    main()
