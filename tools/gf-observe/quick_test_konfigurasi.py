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


RINGKAS = "query{ konfigurasiRingkas{ profil{ sysId versi nama alamat website email } divisi{ id divisi } kontNo{ sysId untuk tahun last01 } pcFlags{ sysId hotel } ownrCount kolomKontro koncabCount } }"


def main():
    d = gql(RINGKAS)["konfigurasiRingkas"]
    print("PROFIL:", json.dumps({k: v for k, v in d["profil"].items() if k != "alamat"}, ensure_ascii=False))
    print("divisi:", len(d["divisi"]), "kontNo:", len(d["kontNo"]), "pcFlags:", len(d["pcFlags"]), "ownr:", d["ownrCount"], "kolom:", d["kolomKontro"], "koncab:", d["koncabCount"])
    assert d["profil"]["nama"] == "MONI COSMETIC SUPERMARKET" and d["kolomKontro"] > 1000
    assert len(d["divisi"]) == 14
    print("READ CHECK: PASS (profil + 14 divisi + 1141 kolom s_kontro)")

    orig = gql('query{ konfigurasiRingkas{ profil{ website } } }')["konfigurasiRingkas"]["profil"]["website"]
    u = gql("mutation($input:KonfigurasiProfilInput!){ simpanKonfigurasiProfil(input:$input){ sysId nama website } }",
            {"input": {"nama": "MONI COSMETIC SUPERMARKET", "website": "TEST-WEB-ID"}})["simpanKonfigurasiProfil"]
    print("UPDATED:", json.dumps(u))
    assert u["website"] == "TEST-WEB-ID"
    gql("mutation($input:KonfigurasiProfilInput!){ simpanKonfigurasiProfil(input:$input){ sysId } }",
        {"input": {"website": orig}})
    back = gql('query{ konfigurasiRingkas{ profil{ website } } }')["konfigurasiRingkas"]["profil"]["website"]
    print("REVERT website:", repr(back))
    assert back == orig
    print("ALL PASS — profil dikembalikan")


if __name__ == "__main__":
    main()
