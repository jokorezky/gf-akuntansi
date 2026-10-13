"""Exhaustive screen explorer (reliable): BM_CLICK buttons + TCM_SETCURSEL tabs.

Usage: python explore_all.py <menu_id> <slug>
Writes tools/gf-observe/explore/<slug>.json + screenshots in screens/.
"""
import sys, os, time, ctypes, json
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, win32process, gf, pyautogui

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
EXP = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\explore"
os.makedirs(EXP, exist_ok=True)
WM_COMMAND = 0x0111
WM_CLOSE = 0x0010
BM_CLICK = 0x00F5
TCM_GETITEMCOUNT = 0x1304
TCM_SETCURSEL = 0x130C
CTRL = {"Static","Edit","Button","ComboBox","ListBox","SysListView32","ListView","SysTreeView32","SysTabControl32","msctls_statusbar32","msctls_updown32"}
BLOCK = {"simpan","hapus","exit","log off","tutup","keluar","delete","buat jurnal","repair","check database",
         "create index","backup","restore","import","export","tutup hari","tutup tahun","reset","hapus data","proses hitung"}
SHELL_TITLE_MARK = "GF-Akuntansi,"


def titled():
    out = {}
    def add(h, _=None):
        if h in out: return
        if win32gui.IsWindowVisible(h):
            out[h] = (win32gui.GetClassName(h), win32gui.GetWindowText(h).strip(), win32gui.GetWindowRect(h))
    win32gui.EnumWindows(add, None)
    win32gui.EnumChildWindows(gf.find_shell()["hwnd"], add, None)
    return out


def dump(hwnd):
    ctrls, seen = [], set()
    def cb(h, _):
        if h in seen: return
        seen.add(h)
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) in CTRL:
            ctrls.append({"class": win32gui.GetClassName(h), "text": win32gui.GetWindowText(h), "rect": list(win32gui.GetWindowRect(h))})
    win32gui.EnumChildWindows(hwnd, cb, None)
    return ctrls


def gf_pid():
    return win32process.GetWindowThreadProcessId(gf.find_shell()["hwnd"])[1]


def gf_buttons():
    pid = gf_pid(); out, seen = [], set()
    def scan(h):
        if h in seen: return
        seen.add(h)
        if not win32gui.IsWindowVisible(h): return
        try:
            if win32process.GetWindowThreadProcessId(h)[1] != pid: return
        except Exception:
            return
        if win32gui.GetClassName(h) == "Button":
            t = win32gui.GetWindowText(h).strip()
            if t: out.append((h, t))
    def child_cb(h, _): scan(h)
    def top_cb(h, _):
        scan(h); win32gui.EnumChildWindows(h, child_cb, None)
    win32gui.EnumWindows(top_cb, None)
    return out


def gf_tabs():
    pid = gf_pid(); out, seen = [], set()
    def cb(h, _):
        if h in seen: return
        seen.add(h)
        if win32gui.GetClassName(h) == "SysTabControl32" and win32gui.IsWindowVisible(h):
            try:
                if win32process.GetWindowThreadProcessId(h)[1] == pid: out.append(h)
            except Exception: pass
    win32gui.EnumWindows(cb, None)
    win32gui.EnumChildWindows(gf.find_shell()["hwnd"], cb, None)
    return out


def close_extras():
    for h, (c, t, r) in titled().items():
        if c in ("DocAppWindow","WndAppWindow","#32770") and t and "Menu Utama" not in t and SHELL_TITLE_MARK not in t:
            try: win32gui.PostMessage(h, WM_CLOSE, 0, 0)
            except Exception: pass
    time.sleep(0.4)


def capture_rect(rect, name):
    try:
        pyautogui.screenshot().crop(rect).save(os.path.join(OUT, name))
        return name
    except Exception:
        return None


def main(mid, slug):
    gf.set_dpi_aware(); ctypes.windll.shcore.SetProcessDpiAwareness(2)
    root = gf.find_shell()["hwnd"]
    win32gui.ShowWindow(root, 3); win32gui.SetForegroundWindow(root); time.sleep(0.4)
    close_extras()
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0); time.sleep(0.9)

    result = {"menu_id": mid, "slug": slug, "tabs": [], "dialogs": [], "buttons_seen": []}
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, mid, 0); time.sleep(1.7)

    # open Tambah (BM_CLICK)
    for h, t in gf_buttons():
        if "tambah" in t.lower().replace("&", ""):
            ctypes.windll.user32.SendMessageW(h, BM_CLICK, 0, 0); time.sleep(1.8); break

    result["buttons_seen"] = [t for _, t in gf_buttons()]
    print("buttons seen:", result["buttons_seen"])

    # TABS
    for tab in gf_tabs():
        n = ctypes.windll.user32.SendMessageW(tab, TCM_GETITEMCOUNT, 0, 0)
        for i in range(n):
            ctypes.windll.user32.SendMessageW(tab, TCM_SETCURSEL, i, 0); time.sleep(0.8)
            r = win32gui.GetWindowRect(tab)
            shot = capture_rect(r, f"{slug}-tab{i+1}.png")
            result["tabs"].append({"index": i, "shot": shot, "controls": dump(tab)})
            print(f"TAB {i+1}/{n} -> {shot}")

    # BUTTONS
    for h, t in gf_buttons():
        low = t.lower().replace("&", "").strip()
        if any(b in low for b in BLOCK):
            continue
        before = titled()
        try:
            ctypes.windll.user32.SendMessageW(h, BM_CLICK, 0, 0)
        except Exception as e:
            result["dialogs"].append({"button": t, "error": str(e)}); continue
        time.sleep(1.1)
        new = [(hh, v) for hh, v in titled().items() if hh not in before and v[0] in ("#32770","WndAppWindow","DocAppWindow") and v[1]]
        for hh, (c, tt, rr) in new:
            shot = capture_rect(rr, f"{slug}-btn-{t[:18].replace(' ','_')}.png")
            result["dialogs"].append({"button": t, "window": tt, "shot": shot, "controls": dump(hh)})
            print(f"BTN {t!r} -> {tt!r}")
        close_extras()

    close_extras()
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)
    json.dump(result, open(os.path.join(EXP, f"{slug}.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"saved explore/{slug}.json tabs={len(result['tabs'])} dialogs={len(result['dialogs'])} buttons={len(result['buttons_seen'])}")


if __name__ == "__main__":
    main(int(sys.argv[1]), sys.argv[2])
