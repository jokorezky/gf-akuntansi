"""Observe a GF master screen fully: list + Tambah form. Generalized.

Usage: python observe_master.py <menu_id> <slug>
"""
import sys, os, time, ctypes, json
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, gf, pyautogui
from pywinauto import Application

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
WM_COMMAND = 0x0111
CTRL = {"Static","Edit","Button","ComboBox","ListBox","SysListView32","ListView","SysTreeView32","SysTabControl32","msctls_statusbar32","msctls_updown32"}


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


def find_button(root, text):
    hit = []
    def scan(h):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
            if text.lower() in win32gui.GetWindowText(h).lower().replace("&",""):
                hit.append(h)
    def child_cb(h, _):
        scan(h)
    def top_cb(h, _):
        scan(h)
        win32gui.EnumChildWindows(h, child_cb, None)
    win32gui.EnumWindows(top_cb, None)
    win32gui.EnumChildWindows(root, child_cb, None)
    return hit[0] if hit else None


def big_modal():
    res = []
    def cb(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "#32770":
            r = win32gui.GetWindowRect(h)
            if r[2]-r[0] > 300 and r[3]-r[1] > 200:
                res.append((h, win32gui.GetWindowText(h), r))
    win32gui.EnumWindows(cb, None)
    return res


def close_all(root):
    for h, (c, t, r) in titled().items():
        if c in ("DocAppWindow","WndAppWindow","#32770") and t and "Menu Utama" not in t and "GF-Akuntansi," not in t:
            win32gui.PostMessage(h, 0x0010, 0, 0)
    time.sleep(0.4)


def main(mid, slug):
    gf.set_dpi_aware(); ctypes.windll.shcore.SetProcessDpiAwareness(2)
    root = gf.find_shell()["hwnd"]
    win32gui.ShowWindow(root, 3); win32gui.SetForegroundWindow(root); time.sleep(0.4)
    close_all(root)
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0); time.sleep(0.9)

    # LIST
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, mid, 0); time.sleep(1.7)
    lst = None
    for h, (c, t, r) in titled().items():
        if c in ("DocAppWindow","WndAppWindow") and t and "GF-Akuntansi," not in t and "Menu Utama" not in t:
            if lst is None or (r[2]-r[0])*(r[3]-r[1]) > (lst[3][2]-lst[3][0])*(lst[3][3]-lst[3][1]):
                lst = (h, c, t, r)
    if lst:
        h, c, t, r = lst
        pyautogui.screenshot().crop(r).save(os.path.join(OUT, f"{slug}-list.png"))
        json.dump({"slug": f"{slug}-list", "title": t, "rect": list(r), "controls": dump(h)},
                  open(os.path.join(OUT, f"{slug}-list.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"LIST {t!r} {r}")

    # FORM
    b = find_button(root, "Tambah")
    if b:
        Application(backend="win32").connect(handle=root).window(handle=b).click_input(); time.sleep(1.8)
        mods = big_modal()
        if mods:
            h, t, r = mods[0]
            pyautogui.screenshot().crop(r).save(os.path.join(OUT, f"{slug}-form.png"))
            ctrls = dump(h)
            json.dump({"slug": f"{slug}-form", "title": t, "rect": list(r), "controls": ctrls},
                      open(os.path.join(OUT, f"{slug}-form.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
            print(f"FORM {t!r} {r} controls={len(ctrls)}")
            for ct in ctrls:
                print("   ", ct["class"], repr(ct["text"]), ct["rect"])
            win32gui.PostMessage(h, 0x0010, 0, 0); time.sleep(0.6)
        else:
            print("no modal after Tambah")
    else:
        print("no Tambah button (read-only screen?)")

    close_all(root)
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)
    print("done", slug)


if __name__ == "__main__":
    main(int(sys.argv[1]), sys.argv[2])
