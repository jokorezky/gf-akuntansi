"""Open a GF list screen (menu id), click a labeled button, capture+dump the resulting form.

Usage: python observe_form.py <menu_id> <slug> <button_text_contains>
Saves screens/<slug>.png + <slug>.json
"""
import sys, os, time, ctypes, json
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui
import gf
import pyautogui
from pywinauto import Application

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
WM_COMMAND = 0x0111
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


def find_button(root, text_contains):
    hit = []

    def cb(h, _):
        if h in hit:
            return
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
            if text_contains.lower() in win32gui.GetWindowText(h).lower().replace("&", ""):
                hit.append(h)
    win32gui.EnumChildWindows(root, cb, None)
    return hit[0] if hit else None


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
            ctrls.append({"class": c, "text": win32gui.GetWindowText(h).strip(), "rect": list(win32gui.GetWindowRect(h))})
    win32gui.EnumChildWindows(hwnd, cb, None)
    return ctrls


def main(mid, slug, btn_text):
    gf.set_dpi_aware()
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass
    root = gf.find_shell()["hwnd"]
    win32gui.ShowWindow(root, 3)
    win32gui.SetForegroundWindow(root)
    time.sleep(0.4)
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)
    time.sleep(0.8)
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, mid, 0)
    time.sleep(1.6)

    b = find_button(root, btn_text)
    if not b:
        print("button not found:", btn_text)
        return
    before = titled()
    app = Application(backend="win32").connect(handle=root)
    app.window(handle=b).click_input()
    time.sleep(1.6)
    after = titled()
    new = {h: v for h, v in after.items() if h not in before}
    cand = [(h, *v) for h, v in new.items() if v[0] in ("DocAppWindow", "WndAppWindow", "#32770") and v[1]]
    if not cand:
        cand = [(h, *v) for h, v in after.items() if v[0] in ("DocAppWindow", "WndAppWindow") and "GF-Akuntansi," not in v[1]]
    if not cand:
        print("no form window after click")
        return
    h, c, t, r = max(cand, key=lambda x: (x[3][2] - x[3][0]) * (x[3][3] - x[3][1]))

    im = pyautogui.screenshot()
    im.crop(r).save(os.path.join(OUT, slug + ".png"))
    ctrls = dump_controls(h)
    with open(os.path.join(OUT, slug + ".json"), "w", encoding="utf-8") as f:
        json.dump({"slug": slug, "menu_id": mid, "window_class": c, "title": t, "rect": list(r), "controls": ctrls},
                  f, indent=2, ensure_ascii=False)
    print(f"{slug}: {t!r} rect={r} controls={len(ctrls)}")
    for ct in ctrls[:60]:
        print(f"  [{ct['class']}] {ct['text']!r} {ct['rect']}")

    # cancel the entry form (no save) and close list
    gf.press_esc()
    time.sleep(0.6)
    gf.press_esc()
    time.sleep(0.4)
    for hh, cc, tt, rr in [(x[1], x[0], x[2], x[3]) for x in cand]:
        try:
            win32gui.PostMessage(x[0], 0x0010, 0, 0)
        except Exception:
            pass
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)


if __name__ == "__main__":
    main(int(sys.argv[1]), sys.argv[2], sys.argv[3])
