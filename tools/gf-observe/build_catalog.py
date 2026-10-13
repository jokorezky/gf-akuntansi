"""Generate katalog laporan TS untuk BE dari rpt-inventory.json (hasil observasi GF).

Output: apps/api/src/modules/laporan/laporan.catalog.ts
"""
import json, re, os

SRC = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\rpt-inventory.json"
DST = r"D:\Projects\gf-akuntansi-clone\apps\api\src\modules\laporan\laporan.catalog.ts"

GROUP_MAP = [
    (("001", "005"), "GL & Perkiraan"),
    (("011", "012", "013"), "Item & Stock"),
    (("021",), "Vendor"),
    (("031", "032"), "Pelanggan"),
    (("101", "111", "112", "113", "121", "131", "132", "133", "141", "142", "151", "161", "162"), "Pembelian"),
    (("201", "204", "205", "206", "207", "208", "209", "221", "222", "223", "231", "241", "242",
      "243", "248", "251", "252", "261", "271", "281", "282", "291"), "Penjualan"),
    (("701", "711", "721", "731", "741", "751", "761", "781"), "Lainnya"),
    (("801", "802", "821", "861", "881", "882", "883"), "Keuangan / GL"),
    (("x",), "Form / Template Cetak"),
]
ORDER = [label for _, label in GROUP_MAP]
PREFIX2GROUP = {p: label for prefixes, label in GROUP_MAP for p in prefixes}


def group_of(prefix: str) -> str:
    return PREFIX2GROUP.get(prefix, "Lainnya")


def display_name(fname: str) -> str:
    base = fname.rsplit(".", 1)[0]
    return re.sub(r"^\d+\s+", "", base).strip()


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    items = []
    for fname in data["groups"]:
        pass
    groups = {}
    for prefix, names in data["groups"].items():
        for fname in names:
            g = group_of(prefix)
            groups.setdefault(g, []).append({
                "kode": fname.rsplit(".", 1)[0],
                "nama": display_name(fname),
                "file": fname,
                "kategori": g,
            })
    ordered = [g for g in ORDER if g in groups]
    total = sum(len(groups[g]) for g in ordered)
    lines = []
    lines.append("/** AUTO-GENERATED oleh tools/gf-observe/build_catalog.py — jangan edit manual. */")
    lines.append("export type LaporanCatalogItem = { kode: string; nama: string; file: string; kategori: string };")
    lines.append("export type LaporanCatalogGroup = { label: string; items: LaporanCatalogItem[] };")
    lines.append("")
    lines.append(f"/** Katalog {total} laporan (folder GF: ST_Rep2), dikelompokkan per modul. */")
    lines.append("export const LAPORAN_CATALOG: LaporanCatalogGroup[] = [")
    for g in ordered:
        lines.append("  {")
        lines.append(f'    label: {json.dumps(g)},')
        lines.append("    items: [")
        for it in sorted(groups[g], key=lambda x: x["file"].lower()):
            lines.append(f'      {{ kode: {json.dumps(it["kode"])}, nama: {json.dumps(it["nama"])}, file: {json.dumps(it["file"])}, kategori: {json.dumps(it["kategori"])} }},')
        lines.append("    ],")
        lines.append("  },")
    lines.append("];")
    os.makedirs(os.path.dirname(DST), exist_ok=True)
    with open(DST, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("wrote", DST, "total", total, "groups", len(ordered))


if __name__ == "__main__":
    main()
