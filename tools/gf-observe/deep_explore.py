"""Deep explore satu layar GF: klik semua tombol rekursif sampai tidak ada window baru.

Usage: python deep_explore.py <menu_id> <slug> [max_depth]

- Buka layar via WM_COMMAND (fokus dulu — GF abaikan WM_COMMAND saat tidak aktif).
- BFS/DFS: untuk tiap window baru (L2..L5), dump kontrol; klik tiap Button
  (kecuali blocklist destruktif), deteksi window baru lagi -> rekursif.
- Catat jalur klik + semua kontrol per level ke explore/<slug>-deep.json
  + screenshot per node ke screens/<slug>-L<n>-<i>.png
- Tutup semua window yang dibuka di akhir (WM_CLOSE + klik Tutup/Batal).
"""
import sys, os, time, json, ctypes
import win32gui
import pyautogui

ROOT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe"
SCREENS = os.path.join(ROOT, "screens")
EXPLORE = os.path.join(ROOT, "explore")
SHELL_TITLE = "GF-Akuntansi, Release : 951.1823 Build 2026.06.28"
WM_COMMAND = 0x0111
WM_CLOSE = 0x0010
BM_CLICK = 0x00F5
FORM_CLASSES = ("#32770", "WndAppWindow", "DocAppWindow")

BLOCKLIST = {
    "exit", "log off", "logout", "keluar", "tutup aplikasi", "quit",
    "create indexes", "repair database", "check database", "hapus", "delete",
    "tutup hari", "tutup tahun", "reset tutup hari", "backup", "restore", "import", "export data",
    "set proteksi", "hapus seluruh", "hapus data", "clear", "simpan", "save",
}


def dpi_aware():
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass


def shell():
    return win32gui.FindWindow(None, SHELL_TITLE) or 329886


def visible_windows():
    out = {}
    def add(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            if t:
                out[h] = t
    win32gui.EnumWindows(add, None)
    return out


def children_windows(hwnd):
    out = {}
    def add(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) in FORM_CLASSES:
            t = win32gui.GetWindowText(h)
            if t:
                out[h] = t
    win32gui.EnumChildWindows(hwnd, add, None)
    return out


def all_named_windows():
    d = visible_windows()
    d.update(children_windows(shell()))
    return d


def controls(hwnd):
    rows = []
    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            rows.append({
                "hwnd": h, "class": win32gui.GetClassName(h),
                "text": win32gui.GetWindowText(h),
                "rect": list(win32gui.GetWindowRect(h)),
                "enabled": bool(win32gui.IsWindowEnabled(h)),
            })
    win32gui.EnumChildWindows(hwnd, cb, None)
    return rows


def buttons(hwnd):
    return [c for c in controls(hwnd) if c["class"] == "Button" and c["text"].strip()]


def safe(text):
    t = text.replace("&", "").strip().lower()
    return not any(b in t for b in BLOCKLIST)


def shot(hwnd, slug):
    win32gui.ShowWindow(hwnd, 9)
    ctypes.windll.user32.BringWindowToTop(hwnd)
    ctypes.windll.user32.SetWindowPos(hwnd, -1, 0, 0, 0, 0, 0x0003)
    time.sleep(0.4)
    l, t, r, b = win32gui.GetWindowRect(hwnd)
    pyautogui.screenshot(region=(l, t, r - l, b - t)).save(os.path.join(SCREENS, slug + ".png"))


def explore_window(hwnd, slug, depth, max_depth, out, counter, visited):
    if hwnd in visited or depth > max_depth:
        return
    visited.add(hwnd)
    ctrls = controls(hwnd)
    idx = len(out["nodes"])
    node_slug = f"{slug}-L{depth}-{idx}"
    out["nodes"].append({
        "index": idx, "depth": depth, "slug": node_slug,
        "title": win32gui.GetWindowText(hwnd), "class": win32gui.GetClassName(hwnd),
        "path": out["path_stack"] + [win32gui.GetWindowText(hwnd)],
        "controls": ctrls,
    })
    try:
        shot(hwnd, node_slug)
    except Exception as e:
        print("  shot err", e)

    for b in buttons(hwnd):
        if not safe(b["text"]):
            continue
        label = b["text"].replace("&", "").strip()
        if label.lower() in ("tutup", "close", "batal", "cancel"):
            continue
        before = set(all_named_windows().keys())
        win32gui.PostMessage(b["hwnd"], BM_CLICK, 0, 0)
        time.sleep(1.4)
        after = all_named_windows()
        neww = [h for h in after.keys() if h not in before and h not in visited]
        out["clicks"].append({"depth": depth, "at": node_slug, "button": label, "new_windows": [after[h] for h in neww]})
        for nh in neww:
            out["path_stack"] = out["path_stack"] + [f"klik:{label}"]
            explore_window(nh, slug, depth + 1, max_depth, out, counter, visited)
            out["path_stack"] = out["path_stack"][:-1]
            win32gui.PostMessage(nh, WM_CLOSE, 0, 0)
            time.sleep(0.8)


def main():
    dpi_aware()
    mid = int(sys.argv[1])
    slug = sys.argv[2]
    max_depth = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    os.makedirs(EXPLORE, exist_ok=True)

    sh = shell()
    win32gui.ShowWindow(sh, 3)
    try:
        win32gui.SetForegroundWindow(sh)
    except Exception:
        pass
    time.sleep(0.6)
    user32 = ctypes.windll.user32
    res = ctypes.c_size_t(0)
    user32.SendMessageTimeoutW(sh, WM_COMMAND, mid, 0, 2, 8000, ctypes.byref(res))
    time.sleep(2.2)

    after = all_named_windows()
    before_known = {"Online", "Menu Utama"}
    target = None
    best_area = 0
    for h, t in after.items():
        if any(k in t for k in before_known) or t.startswith("GF-Akuntansi"):
            continue
        try:
            l, tt, r, b = win32gui.GetWindowRect(h)
            area = (r - l) * (b - tt)
        except Exception:
            area = 0
        if area > best_area:
            best_area = area
            target = h
    if not target:
        print("Tidak ada window baru terbuka; cek WM_COMMAND/fokus.")
        return 1

    out = {"slug": slug, "menu_id": mid, "max_depth": max_depth, "nodes": [], "clicks": [], "path_stack": []}
    explore_window(target, slug, 1, max_depth, out, [0], set())
    p = os.path.join(EXPLORE, f"{slug}-deep.json")
    json.dump(out, open(p, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print("saved", p, "nodes:", len(out["nodes"]), "clicks:", len(out["clicks"]))
    win32gui.PostMessage(target, WM_CLOSE, 0, 0)
    return 0


if __name__ == "__main__":
    sys.exit(main())
