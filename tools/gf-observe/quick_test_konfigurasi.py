import json
import urllib.error
import urllib.request


def gql(q, v=None):
    body = json.dumps({"query": q, "variables": v or {}}).encode()
    req = urllib.request.Request("http://localhost:4000/graphql", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise SystemExit("HTTP " + str(e.code) + ": " + e.read().decode()[:300])
    if "errors" in d:
        raise SystemExit("ERR: " + json.dumps(d["errors"][0]["message"]))
    return d["data"]


F = "sysId versi nama alamat negara npwp npwpNama pkpNo fakpjkNo telepon fax email website rekening1 rekening2 rekening3 rekening4 rekening5 qris menuHotel menuKtv menuBill"
RINGKAS = "query{ konfigurasiRingkas{ profil{ %s } divisi{ id divisi } kontNo{ sysId } pcFlags{ sysId } ownrCount kolomKontro koncabCount } }" % F
SIMPAN = "mutation($input:KonfigurasiProfilInput!){ simpanKonfigurasiProfil(input:$input){ sysId nama website } }"


def main():
    d = gql(RINGKAS)["konfigurasiRingkas"]
    orig = d["profil"]
    print("ORIGINAL:", json.dumps({k: orig[k] for k in ("sysId", "nama", "negara", "npwpNama")}, ensure_ascii=False))
    print("divisi:", len(d["divisi"]), "kontNo:", len(d["kontNo"]), "kolom:", d["kolomKontro"], "koncab:", d["koncabCount"])
    assert orig["nama"] == "MONI COSMETIC SUPERMARKET" and d["kolomKontro"] > 1000
    assert len(d["divisi"]) == 14
    print("READ CHECK: PASS (profil + 14 divisi + 1141 kolom s_kontro)")

    u = gql(SIMPAN, {"input": {"website": "TEST-WEB-ID"}})["simpanKonfigurasiProfil"]
    print("PARTIAL UPDATE:", json.dumps(u))
    after = gql(RINGKAS)["konfigurasiRingkas"]["profil"]
    assert after["website"] == "TEST-WEB-ID"
    assert after["nama"] == "MONI COSMETIC SUPERMARKET", "COALESCE gagal: nama tertimpa!"
    assert after["alamat"] == orig["alamat"], "COALESCE gagal: alamat tertimpa!"
    print("COALESCE CHECK: PASS (partial update tidak menghapus field lain)")

    full = {k: orig[k] for k in ("nama", "alamat", "negara", "npwp", "npwpNama", "pkpNo", "fakpjkNo",
                                 "telepon", "fax", "email", "website", "rekening1", "rekening2", "rekening3",
                                 "rekening4", "rekening5", "qris", "menuHotel", "menuKtv", "menuBill")}
    restore = {k: ("" if full[k] is None else full[k]) for k in full}
    gql(SIMPAN, {"input": restore})
    back = gql(RINGKAS)["konfigurasiRingkas"]["profil"]
    for k in ("nama", "alamat", "negara", "website"):
        assert back[k] == orig[k], f"restore gagal utk {k}: {back[k]!r} != {orig[k]!r}"
    print("RESTORE CHECK: PASS (profil kembali persis)")
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
