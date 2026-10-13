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
    try:
        gql("mutation{ deletePelanggan(id:16) }")
    except SystemExit:
        pass
    inp = {"nama": "TEST V2 PELANGGAN", "kode": "TP001", "alamat": "Jl Uji Pelanggan",
           "tipe": 2, "title": 0, "negara": 1, "npwp": "111", "npwpNama": "Pemilik Uji",
           "hubungi2": "Pak Dua", "bbTelp2X": None, "hubTelp2": "0899", "catatan": "cat uji",
           "catShow": True, "blackList": False, "tanpaCrdc": True, "pjHarLst": True,
           "salesId": 2, "collectorId": 3, "userLvl": "2", "ppnTipe": 1, "ppnPers": "11.00",
           "stsPers": "Kawin", "noKtp": "123456", "jenisKel": 1, "tmpLahir": "Batam",
           "tglLahir": "1990-01-01", "krmNama": "Alamat Kirim", "setadj1per": "2.00"}
    inp.pop("bbTelp2X")
    d = gql("mutation($input:PelangganInput!){ createPelanggan(input:$input){ id nama kode hp: hubungi2 catShow userLvl ppnPers stsPers noKtp jenisKel tk: tmpLahir tl: tglLahir krmNama setadj1per tanpaCrdc } }", {"input": inp})
    print("CREATED", json.dumps(d["createPelanggan"], ensure_ascii=False))

    # fallback create fields tanpa alias (alias di atas valid syntax; jika schema beda akan error jelas)
    d2 = gql("query($id:Int!){ pelangganById(id:$id){ id nama kode catShow userLvl ppnPers tanpaCrdc pjHarLst stsPers noKtp tmpLahir tglLahir krmNama setadj1per } }", {"id": d["createPelanggan"]["id"]})
    print("READ", json.dumps(d2["pelangganById"], ensure_ascii=False))

    vid = d["createPelanggan"]["id"]
    d3 = gql("mutation{ updatePelanggan(id:%d, input:{nama:\"TEST V2 PELANGGAN ED\", userLvl:\"5\", catShow:false, blackList:true}){ id nama userLvl catShow blackList } }" % vid)
    print("UPDATED", json.dumps(d3["updatePelanggan"], ensure_ascii=False))

    d4 = gql("mutation{ deletePelanggan(id:%d) }" % vid)
    print("DELETED", d4["deletePelanggan"])

    d5 = gql("query{ pelangganList(q:\"TEST V2\"){ total } }")
    print("leftover:", d5["pelangganList"]["total"])


if __name__ == "__main__":
    main()
