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


def info(sid):
    return gql("query($id:Int!){ promoItemInfo(stockId:$id){ stockId nama hargaBeli hargaJ1 disc1J1 } }", {"id": sid})["promoItemInfo"]


def main():
    before = info(23916)
    print("ITEM BEFORE:", json.dumps(before))
    assert before["hargaJ1"] == "75000.00", before

    c = gql("mutation($input:PromosiInput!){ createPromosi(input:$input){ id tanggal1 tanggal2 pukul1 pukul2 hari penjEcr penjCsh penjCrd divisi } }",
            {"input": {"tanggal1": "2026-10-13", "tanggal2": "2026-10-31", "pukul1": 800, "pukul2": 1700,
                       "hari": "1,3,5", "penjEcr": True, "penjCsh": True, "penjCrd": False,
                       "divisi": "5,6", "groupPel": "", "catatan": "TEST BARANG PROMOSI"}})["createPromosi"]
    print("CREATED:", json.dumps(c, ensure_ascii=False))
    assert c["hari"] == "1,3,5" and c["divisi"] == "5,6" and c["pukul1"] == 800 and c["penjEcr"] and not c["penjCrd"]
    pid = c["id"]
    print("HEADER CHECK: PASS (hari/divisi/pukul/tipe entry tersimpan)")

    g = gql("query{ grppelRefList { id nama } }")["grppelRefList"]
    g2 = gql("query{ grppe2RefList { id nama } }")["grppe2RefList"]
    print("GROUP PEL:", len(g), "GROUP PE2:", len(g2), g[:2], g2[:2])
    print("GROUP REF CHECK: PASS")

    ok = gql("mutation($promosId:Int!,$stockId:Int!,$mode:String!,$levels:[PromoLevelIn!]!){ promoTerapkanItem(promosId:$promosId, stockId:$stockId, mode:$mode, levels:$levels) }",
             {"promosId": pid, "stockId": 23916, "mode": "harga",
              "levels": [{"level": 1, "harga": "80000", "discPers": "5", "discPers2": "0", "discPers3": "0"}]})["promoTerapkanItem"]
    after = info(23916)
    print("SET HARGA SPESIAL:", ok, "->", json.dumps(after))
    assert after["hargaJ1"] == "80000.00" and after["disc1J1"] == "5.00"
    print("SETTING HARGA JUAL SPESIAL: PASS (tulis ke master s_stock)")

    gql("mutation($promosId:Int!,$stockId:Int!,$mode:String!,$levels:[PromoLevelIn!]!){ promoTerapkanItem(promosId:$promosId, stockId:$stockId, mode:$mode, levels:$levels) }",
        {"promosId": pid, "stockId": 23916, "mode": "harga",
         "levels": [{"level": 1, "harga": "75000", "discPers": "0", "discPers2": "0", "discPers3": "0"}]})
    restored = info(23916)
    assert restored["hargaJ1"] == "75000.00" and restored["disc1J1"] is None or restored["disc1J1"] in ("0.00", None)
    print("REVERT HARGA MASTER: PASS (kembali 75000)")

    gql("mutation($promosId:Int!,$stockId:Int!,$mode:String!,$levels:[PromoLevelIn!]!){ promoTerapkanItem(promosId:$promosId, stockId:$stockId, mode:$mode, levels:$levels) }",
        {"promosId": pid, "stockId": 23916, "mode": "disc",
         "levels": [{"level": 1, "harga": "75000", "discPers": "10"}, {"level": 2, "harga": "80000", "discPers": "7"}]})
    lv = gql("query($id:Int!){ promoLevelList(promosId:$id){ sysId hargaDari discPers } }", {"id": pid})["promoLevelList"]
    print("S_PROMEX ROWS:", json.dumps(lv))
    assert len(lv) == 2 and lv[0]["discPers"] == "10.00"
    print("RELASI s_prome1.promos_id: PASS (2 baris level)")

    gql("mutation($promosId:Int!,$stockId:Int!,$mode:String!,$levels:[PromoLevelIn!]!){ promoTerapkanItem(promosId:$promosId, stockId:$stockId, mode:$mode, levels:$levels) }",
        {"promosId": pid, "stockId": 23916, "mode": "disc", "levels": []})
    lv2 = gql("query($id:Int!){ promoLevelList(promosId:$id){ sysId } }", {"id": pid})["promoLevelList"]
    print("CLEANUP LEVEL:", len(lv2))

    ok2 = gql("mutation($id:Int!){ deletePromosi(id:$id) }", {"id": pid})["deletePromosi"]
    gone = gql("query($id:Int!){ promosiById(id:$id){ id } }", {"id": pid})["promosiById"]
    print("DELETED:", ok2, "gone:", gone is None)
    assert ok2 and gone is None
    print("ALL PASS — bersih")


if __name__ == "__main__":
    main()
