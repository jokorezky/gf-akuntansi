import json
import urllib.error
import urllib.request


def gql(q, v=None):
    body = json.dumps({"query": q, "variables": v or {}}).encode()
    req = urllib.request.Request("http://localhost:4000/graphql", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode()).get("data")
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:200])
        return None


for pid in (2, 3):
    print("delete", pid, ":", gql("mutation($id:Int!){ deletePromosi(id:$id) }", {"id": pid}))
print("leftover:", gql('query{ promosiList(q:"TEST BARANG PROMOSI"){ total rows { id catatan } } }')["promosiList"])
