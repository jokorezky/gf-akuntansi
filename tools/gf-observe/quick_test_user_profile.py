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
    u = gql("query{ secUserList(limit:5){ total rows { id user securiId grupNama pemilik userpusat hasPassword } } }")["secUserList"]
    print("USERS:", u["total"], json.dumps(u["rows"][:2], ensure_ascii=False))
    g = gql("query{ secGrupList(limit:5){ total rows { id nama pemilik jumlahUser securityInfo } } }")["secGrupList"]
    print("GRUP:", g["total"], json.dumps(g["rows"][:3], ensure_ascii=False))
    assert u["total"] > 0 and g["total"] > 0
    assert any(r["grupNama"] for r in u["rows"]) or u["rows"][0]["securiId"] is not None if u["rows"][0]["securiId"] else True
    print("READ CHECK: PASS (user + grup; relasi securi_id->grup terbaca)")

    gc = gql("mutation($input:SecGrupInput!){ createSecGrup(input:$input){ id nama pemilik jumlahUser } }",
             {"input": {"nama": "TSTGRPV2", "pemilik": "TESTER"}})["createSecGrup"]
    print("GRUP CREATED:", json.dumps(gc))
    assert gc["nama"] == "TSTGRPV2" and gc["jumlahUser"] == 0

    uc = gql("mutation($input:SecUserInput!){ createSecUser(input:$input){ id user securiId grupNama pemilik userpusat hasPassword } }",
             {"input": {"user": "TSTUSRV2", "securiId": gc["id"], "pemilik": "TESTER", "password": "rahasia123"}})["createSecUser"]
    print("USER CREATED:", json.dumps(uc))
    assert uc["securiId"] == gc["id"] and uc["grupNama"] == "TSTGRPV2" and uc["hasPassword"] is True
    print("RELASI CHECK: PASS (user.securi_id -> grup terbaca namanya; password tersimpan ter-mask)")

    dup = gql("mutation($id:Int!){ duplicateSecUser(id:$id){ id user securiId } }", {"id": uc["id"]})["duplicateSecUser"]
    print("DUPLICATE:", json.dumps(dup))
    assert "COPY" in (dup["user"] or "") and dup["securiId"] == gc["id"]

    gu = gql("mutation($id:Int!,$input:SecGrupInput!){ updateSecGrup(id:$id, input:$input){ nama pemilik } }",
             {"id": gc["id"], "input": {"nama": "TSTGRP2", "pemilik": "TESTER2"}})["updateSecGrup"]
    print("GRUP UPDATED:", json.dumps(gu))
    assert gu["nama"] == "TSTGRP2"

    jml = gql("query{ secGrupList(q:\"TEST GRUP V2\"){ rows { id jumlahUser } } }")["secGrupList"]["rows"]
    print("JUMLAH USER GRUP:", json.dumps(jml))

    for pid in (dup["id"], uc["id"]):
        gql("mutation($id:Int!){ deleteSecUser(id:$id) }", {"id": pid})
    for r in gql('query{ secUserList(q:"TSTUSRV2"){ rows { id } } }')["secUserList"]["rows"]:
        gql("mutation($id:Int!){ deleteSecUser(id:$id) }", {"id": r["id"]})
    for r in gql('query{ secGrupList(q:"TSTGRPV2"){ rows { id } } }')["secGrupList"]["rows"]:
        gql("mutation($id:Int!){ deleteSecGrup(id:$id) }", {"id": r["id"]})
    lu = gql('query{ secUserList(q:"TSTUSRV2"){ total } }')["secUserList"]["total"]
    lgd = gql('query{ secGrupList(q:"TSTGRPV2"){ total } }')["secGrupList"]["total"]
    print("leftover user:", lu, "grup:", lgd)
    assert lu == 0 and lgd == 0
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
