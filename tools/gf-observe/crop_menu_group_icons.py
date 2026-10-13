"""Crop ikon SEMUA tombol menu box GF + tata letak absolut -> menu-boxes.ts.

Temuan: box menu = SATU window DocAppWindow yang title-nya berganti; label item
di box BERBEDA dari menubar (label pendek). Tombol "Menu Utama (ESC)" = kembali.

Output:
- apps/web/public/gf-icons/menu/<group>/<label>.png
- tools/gf-observe/menu-icons.json (rect, %-pos relatif area konten, id)
- apps/web/src/lib/menu-boxes.ts (layout 1:1 utk FE)
"""
import os, re, json, time, ctypes
import win32gui
import win32ui
from PIL import Image

ROOT = r"D:\Projects\gf-akuntansi-clone"
OUT_ICONS = os.path.join(ROOT, "apps", "web", "public", "gf-icons", "menu")
OUT_JSON = os.path.join(ROOT, "tools", "gf-observe", "menu-icons.json")
OUT_TS = os.path.join(ROOT, "apps", "web", "src", "lib", "menu-boxes.ts")
SHELL_TITLE = "GF-Akuntansi, Release : 951.1823 Build 2026.06.28"
WM_COMMAND = 0x0111
BM_CLICK = 0x00F5

# urutan item di box (dari observasi) -> id native menu
ID_MAP = {
    "Menu Utama": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # bukan menu item (grup)
    "Aplikasi": [24486, 24489, 24490, 24491, 24492, 24497, 24500],
    "Sistem Setup": [24521, 24524, 24520, 24532, 24533, 24540, 24543, 24544, 24550, 24551, 24537],
    "Master File": [24553, 24554, 24556, 24558, 24559],
    "Pembelian": [24562, 24566, 24567, 24572, 24573, 24575],
    "Penjualan": [24593, 24598, 24600, 24602, 24610, 24612],
    "Antar Cabang": [24632, 24633],
    "Kas": [24620, 24624, 24627, 24621, 24625, 24628, 24622],
    "GL": [24635, 24637, 24639, 24640, 24642, 24644],
    "Lainnya": [24646, 24647, 24656, 24650, 24651, 24652, 24658, 24659, 24667, 24661, 24662, 24663, 24665],
    "Help": [],
}
GROUPS = ["Aplikasi", "Sistem Setup", "Master File", "Pembelian", "Penjualan",
          "Antar Cabang", "Kas", "GL", "Lainnya", "Bantuan"]
BLOCKED_IDS = {24489, 24490, 24491, 24492, 24493, 24495, 24497, 24500, 24501, 24502, 24504,
               24505, 24518, 24537, 24540, 24542, 24543, 24544, 24550, 24551, 24667}
# label visual di box GF (window text terpotong; label asli dari screenshot)
LABEL_OVERRIDES = {
    24573: "Pembayaran Hutang", 24610: "Penerimaan Piutang",
    24650: "Barang Transfer", 24651: "Barang Untransfer", 24652: "Barang Pindah Gudang",
    24658: "Barang Masuk (Penyesuaian)", 24659: "Barang Keluar (Rusak/Hilang/Free/...)",
    24667: "Proses Laporan Total Transaksi", 24520: "List (Mata Uang, Kurs, Negara, dsbnya)",
    24540: "Set Proteksi Data", 24550: "Tutup Tahun Pembukuan", 24551: "Hapus Data s/d Tanggal",
    24537: "Buat Jurnal Khusus (Transaksi)",
}


def dpi_aware():
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass


def shell():
    return win32gui.FindWindow(None, SHELL_TITLE)


def menu_box():
    found = []
    def add(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "DocAppWindow" \
                and win32gui.GetWindowText(h).startswith("Menu "):
            found.append(h)
    sh = shell()
    if sh:
        win32gui.EnumChildWindows(sh, add, None)
    win32gui.EnumWindows(add, None)
    return found[0] if found else None


def children_all(hwnd):
    out = []
    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            out.append({"hwnd": h, "class": win32gui.GetClassName(h),
                        "text": win32gui.GetWindowText(h).strip(),
                        "rect": list(win32gui.GetWindowRect(h))})
    win32gui.EnumChildWindows(hwnd, cb, None)
    return out


def buttons(hwnd):
    return [c for c in children_all(hwnd) if c["class"] == "Button" and c["text"]]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def click_btn(b):
    win32gui.PostMessage(b["hwnd"], BM_CLICK, 0, 0)


def find_btn(hwnd, text):
    for b in buttons(hwnd):
        if b["text"].replace("&", "").strip().lower() == text.lower():
            return b
    return None


def ensure_box_at_home():
    box = menu_box()
    if not box:
        sh = shell()
        win32gui.ShowWindow(sh, 3)
        try:
            win32gui.SetForegroundWindow(sh)
        except Exception:
            pass
        time.sleep(0.5)
        res = ctypes.c_size_t(0)
        ctypes.windll.user32.SendMessageTimeoutW(sh, WM_COMMAND, 24514, 0, 2, 8000, ctypes.byref(res))
        time.sleep(1.8)
        box = menu_box()
    if box and win32gui.GetWindowText(box).strip() != "Menu Utama":
        back = find_btn(box, "Menu Utama (ESC)")
        if back:
            click_btn(back)
            time.sleep(1.2)
    return menu_box()


def content_rect(box):
    for c in children_all(box):
        if c["class"] == "WndAppWindow" and c["rect"][2] - c["rect"][0] > 200:
            return c["rect"]
    return win32gui.GetWindowRect(box)


def print_window(hwnd):
    """Capture isi window via PrintWindow (tetap benar walau tertutup window lain)."""
    l, t, r, b = win32gui.GetWindowRect(hwnd)
    w, h = r - l, b - t
    hwnd_dc = win32gui.GetWindowDC(hwnd)
    mfc_dc = win32ui.CreateDCFromHandle(hwnd_dc)
    save_dc = mfc_dc.CreateCompatibleDC()
    bmp = win32ui.CreateBitmap()
    bmp.CreateCompatibleBitmap(mfc_dc, w, h)
    save_dc.SelectObject(bmp)
    ctypes.windll.user32.PrintWindow(hwnd, save_dc.GetSafeHdc(), 3)
    info = bmp.GetInfo()
    bits = bmp.GetBitmapBits(True)
    im = Image.frombuffer("RGB", (info["bmWidth"], info["bmHeight"]), bits, "raw", "BGRX", 0, 1)
    win32gui.DeleteObject(bmp.GetHandle())
    save_dc.DeleteDC()
    mfc_dc.DeleteDC()
    win32gui.ReleaseDC(hwnd, hwnd_dc)
    return im


def capture(box, group_key, group_btn_label, result, is_home=False):
    title = win32gui.GetWindowText(box).strip()
    items = [b for b in buttons(box) if "menu utama" not in b["text"].lower()
             and b["text"].replace("&", "").strip().lower() not in ("tutup", "close")]
    print(f"== {group_btn_label}: box '{title}' items={len(items)}")
    cont = content_rect(box)
    img = print_window(box)
    cli = win32gui.ClientToScreen(box, (0, 0))
    cw = cont[2] - cont[0]
    ch = cont[3] - cont[1]
    ids = ID_MAP.get(group_key, [])
    gslug = "menu-utama" if is_home else slug(group_key)
    os.makedirs(os.path.join(OUT_ICONS, gslug), exist_ok=True)
    seen_names = {}
    for i, b in enumerate(items):
        label = b["text"].replace("&", "").split("\t")[0].strip()
        x1, y1, x2, y2 = b["rect"]
        w_px = x2 - x1
        h_px = y2 - y1
        is_small = h_px < 60
        base = slug(label)
        seen_names[base] = seen_names.get(base, 0) + 1
        fname = base + (".png" if seen_names[base] == 1 else f"-{seen_names[base]}.png")
        if is_small:
            icon = ""
        else:
            # ikon = area persegi di atas tombol (hindari teks label multi-baris)
            side = w_px - 12
            cx1, cy1 = x1 + 6 - cli[0], y1 + 3 - cli[1]
            icon = f"/gf-icons/menu/{gslug}/{fname}"
            try:
                img.crop((cx1, cy1, cx1 + side, cy1 + side)).save(
                    os.path.join(OUT_ICONS, gslug, fname))
            except Exception as e:
                print("   crop err", label, e)
                continue
        item_id = ids[i] if i < len(ids) else None
        rel = {
            "x": round((x1 - cont[0]) / cw * 100, 2),
            "y": round((y1 - cont[1]) / ch * 100, 2),
            "w": round((x2 - x1) / cw * 100, 2),
            "h": round((y2 - y1) / ch * 100, 2),
        }
        result.append({"group": group_key, "label": label, "id": item_id,
                       "icon": icon, "small": is_small, "rect": b["rect"], "rel": rel,
                       "content": cont, "content_size": [cw, ch]})
        print(f"   - {label} -> {icon or '(small)'} (id={item_id}, rel={rel['x']},{rel['y']})")


def main():
    # PENTING: JANGAN set DPI aware — PrintWindow merender pada skala aplikasi (1x),
    # sehingga koordinat GetWindowRect/ClientToScreen harus dalam ruang virtual (logical).
    os.makedirs(OUT_ICONS, exist_ok=True)
    result = []
    box = ensure_box_at_home()
    assert box, "Menu box tidak ditemukan"
    if win32gui.GetWindowText(box).strip() == "Menu Utama":
        capture(box, "Menu Utama", "Menu Utama", result, is_home=True)
    else:
        print("!! gagal reset ke Menu Utama; skip capture home")

    for g in GROUPS:
        ok = False
        for attempt in range(2):
            box = ensure_box_at_home()
            if not box:
                print(f"!! box hilang sebelum grup {g}")
                time.sleep(1.5)
                continue
            gb = find_btn(box, g)
            if not gb:
                print(f"!! tombol '{g}' tidak ditemukan di {win32gui.GetWindowText(box)}")
                break
            click_btn(gb)
            # tunggu sampai box benar-benar berganti
            for _ in range(10):
                time.sleep(0.5)
                if win32gui.GetWindowText(box).strip() == f"Menu {g}":
                    ok = True
                    break
            if ok:
                break
            print(f".. retry grup {g} (title={win32gui.GetWindowText(box)})")
        if not ok:
            if g == "Bantuan":
                print("!! Bantuan tidak membuka box menu (perilaku GF berbeda) - dilewati")
            else:
                print(f"!! gagal membuka box '{g}'")
            continue
        key = "Help" if g == "Bantuan" else g
        capture(box, key, g, result)

    for r in result:
        if r["id"] in LABEL_OVERRIDES:
            r["label"] = LABEL_OVERRIDES[r["id"]]
    json.dump(result, open(OUT_JSON, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

    # menu-boxes.ts
    groups = {}
    for r in result:
        groups.setdefault(r["group"], []).append(r)
    lines = [
        "/** AUTO-GENERATED oleh tools/gf-observe/crop_menu_group_icons.py — layout + ikon menu box GF. */",
        "export type GfBoxButton = {",
        "  id?: number; label: string; icon: string; blocked?: boolean; small?: boolean;",
        "  x: number; y: number; w: number; h: number;",
        "};",
        "export type GfMenuBox = { slug: string; group: string; title: string; ratio: number; items: GfBoxButton[] };",
        "export const GF_MENU_BOXES: GfMenuBox[] = [",
    ]
    for g, items in groups.items():
        slug_g = "menu-utama" if g == "Menu Utama" else slug(g)
        title = "Menu Utama" if g == "Menu Utama" else f"Menu {g}"
        ratio = round(items[0]["content_size"][1] / items[0]["content_size"][0], 4)
        lines.append("  {")
        lines.append(f'    slug: {json.dumps(slug_g)}, group: {json.dumps(g)}, title: {json.dumps(title)}, ratio: {ratio},')
        lines.append("    items: [")
        for it in items:
            bid = it["id"]
            blocked = "true" if (bid in BLOCKED_IDS) else "false"
            small = "true" if it.get("small") else "false"
            idpart = f'id: {bid}, ' if bid else ""
            lines.append(
                f'      {{ {idpart}label: {json.dumps(it["label"])}, icon: {json.dumps(it["icon"])}, '
                f'blocked: {blocked}, small: {small}, x: {it["rel"]["x"]}, y: {it["rel"]["y"]}, w: {it["rel"]["w"]}, h: {it["rel"]["h"]} }},'
            )
        lines.append("    ],")
        lines.append("  },")
    lines.append("];")
    open(OUT_TS, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"OK: {len(result)} tombol -> {OUT_JSON}; {OUT_TS}")


if __name__ == "__main__":
    main()
