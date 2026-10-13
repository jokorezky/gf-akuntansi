"""Observe one GF screen: open by menu id, capture + dump controls, close.

Usage: python observe_screen.py <menu_id> <slug>
Saves tools/gf-observe/screens/<slug>.png + <slug>.json
"""
import sys, os, time, ctypes, json
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui
import gf
import pyautogui

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
os.makedirs(OUT, exist_ok=True)
WM_COMMAND = 0x0111
WM_CLOSE = 0x0010
CTRL_CLASSES = {
    "Static", "Edit", "Button", "ComboBox", "ListBox", "SysListView32", "ListView",
    "SysTreeView32", "SysTabControl32", "msctls_statusbar32", "ToolbarWindow32", "msctls_updown32",
}


def titled():
    out = {}

    def add(h, _=None):
        if h in out:
            return
        if win32gui.IsWindowVisible(h):
            out[h] = (win32gui.GetClassName(h), win32gui.GetWindowText(h).strip(), win32gui.GetWindowRect(h))
    win32gui.EnumWindows(add, None)
    win32gui.EnumChildWindows(gf.find_shell()["hwnd"], add, None)
    return out


def dump_controls(hwnd):
    ctrls = []
    seen = set()

    def cb(h, _):
        if h in seen:
            return
        seen.add(h)
        if not win32gui.IsWindowVisible(h):
            return
        c = win32gui.GetClassName(h)
        if c in CTRL_CLASSES or c.startswith("Sys"):
            ctrls.append({
                "class": c,
                "text": win32gui.GetWindowText(h).strip(),
                "rect": list(win32gui.GetWindowRect(h)),
            })
    win32gui.EnumChildWindows(hwnd, cb, None)
    return ctrls


def main(mid, slug):
    gf.set_dpi_aware()
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass
    root = gf.find_shell()["hwnd"]
    win32gui.ShowWindow(root, 3)
    win32gui.SetForegroundWindow(root)
    time.sleep(0.4)
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)  # home
    time.sleep(0.9)
    before = titled()
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, mid, 0)
    time.sleep(1.6)
    after = titled()
    new = {h: v for h, v in after.items() if h not in before}

    # pick the form window
    cand = []
    for h, (c, t, r) in new.items():
        if c in ("DocAppWindow", "WndAppWindow", "#32770") and t and "Menu Utama" not in t:
            cand.append((h, c, t, r))
    if not cand:
        for h, (c, t, r) in after.items():
            if c in ("DocAppWindow", "WndAppWindow", "#32770") and t and "GF-Akuntansi," not in t and "Menu Utama" not in t:
                cand.append((h, c, t, r))
    if not cand:
        print("NO FORM WINDOW FOUND; new windows:", [(v[0], v[1]) for v in new.values()])
        return
    h, c, t, r = max(cand, key=lambda x: (x[3][2] - x[3][0]) * (x[3][3] - x[3][1]))

    im = pyautogui.screenshot()
    im.crop(r).save(os.path.join(OUT, slug + ".png"))
    ctrls = dump_controls(h)
    data = {"slug": slug, "menu_id": mid, "window_class": c, "title": t, "rect": list(r), "controls": ctrls}
    with open(os.path.join(OUT, slug + ".json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"{slug}: {t!r} rect={r} controls={len(ctrls)}")
    for ct in ctrls[:40]:
        print(f"  [{ct['class']}] {ct['text']!r} {ct['rect']}")

    win32gui.PostMessage(h, WM_CLOSE, 0, 0)
    time.sleep(0.5)
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)


if __name__ == "__main__":
    main(int(sys.argv[1]), sys.argv[2])
