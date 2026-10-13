"""Banding graf UI GF (explore/<slug>-deep.json) vs source clone (TSX).

- Ambil label kontrol dari JSON GF (Button/Static/Edit/ComboBox/ListView).
- Ambil string teks dari TSX/DIR clone (JSX text, label array, placeholder).
- Laporkan label GF yang tidak punya padanan (case-insensitive substring).

Usage: python diff_deep.py <slug> <tsx-file-atau-dir>
"""
import sys, os, json, re

ROOT = r"D:\Projects\gf-akuntansi-clone"


def gf_labels(slug):
    p = os.path.join(ROOT, "tools", "gf-observe", "explore", f"{slug}-deep.json")
    data = json.load(open(p, encoding="utf-8"))
    labels = {}
    for node in data["nodes"]:
        for c in node["controls"]:
            t = (c.get("text") or "").strip()
            if not t or t == "...":
                continue
            if c["class"] in ("Button", "Static", "Edit", "ComboBox", "SysHeader32"):
                labels.setdefault(t, []).append(node["slug"])
    return labels


def clone_texts(path):
    files = []
    if os.path.isdir(path):
        for root, _, names in os.walk(path):
            for n in names:
                if n.endswith((".tsx", ".ts")):
                    files.append(os.path.join(root, n))
    else:
        files.append(path)
    blob = []
    for f in files:
        src = open(f, encoding="utf-8", errors="ignore").read()
        blob += re.findall(r'>\s*([^<>{}\n]{2,80}?)\s*<', src)
        blob += re.findall(r'"([^"\n]{2,80})"', src)
        blob += re.findall(r"'([^'\n]{2,80})'", src)
    return [b.strip() for b in blob if b.strip()]


def norm(s):
    return re.sub(r"[^a-z0-9/&\- ]+", "", s.lower().replace("&", "")).strip()


def main():
    slug = sys.argv[1]
    target = sys.argv[2]
    gfl = gf_labels(slug)
    clones = [norm(c) for c in clone_texts(target)]
    cl_blob = " || ".join(clones)
    missing, present = [], []
    for label, nodes in gfl.items():
        nl = norm(label)
        if len(nl) < 2:
            continue
        if nl in cl_blob:
            present.append(label)
        else:
            missing.append((label, nodes))
    print(f"GF label unik: {len(gfl)} | ada di clone: {len(present)} | MENGHILANG: {len(missing)}")
    print("--- label GF yang belum ada di clone:")
    for label, nodes in sorted(missing):
        where = ",".join(sorted(set(nodes))[:3])
        print(f"  - {label!r}   ({where})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
