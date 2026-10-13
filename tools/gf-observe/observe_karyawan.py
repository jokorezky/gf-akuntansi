"""Observe Karyawan fully: list screen + Tambah entry form. Cleans up at the end."""
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
    def cb(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
            if text.lower() in win32gui.GetWindowText(h).lower().replace("&", ""):
                hit.append(h)
    win32gui.EnumChildWindows(root, cb, None)
    return hit[0] if hit else None


def to_home(root):
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0)
    time.sleep(0.9)


def main():
    gf.set_dpi_aware()
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
    root = gf.find_shell()["hwnd"]
    win32gui.ShowWindow(root, 3); win32gui.SetForegroundWindow(root); time.sleep(0.4)

    # cleanup: close every visible form/dialog (keep shell)
    for _ in range(4):
        closed = False
        for h, (c, t, r) in titled().items():
            if c in ("DocAppWindow", "WndAppWindow", "#32770") and t and "Menu Utama" not in t and "GF-Akuntansi," not in t:
                win32gui.PostMessage(h, 0x0010, 0, 0); closed = True
        if not closed: break
        time.sleep(0.5)
    to_home(root)

    # LIST
    ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24553, 0)
    time.sleep(1.6)
    lst = None
    for h, (c, t, r) in titled().items():
        if c in ("DocAppWindow", "WndAppWindow") and t == "Karyawan":
            lst = (h, c, t, r)
    if lst:
        h, c, t, r = lst
        pyautogui.screenshot().crop(r).save(os.path.join(OUT, "karyawan-list.png"))
        json.dump({"slug": "karyawan-list", "window_class": c, "title": t, "rect": list(r), "controls": dump(h)},
                  open(os.path.join(OUT, "karyawan-list.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print("LIST ok", r)

    # ENTRY FORM (Tambah)
    b = find_button(root, "Tambah")
    print("tambah btn:", b, win32gui.GetWindowRect(b) if b else None)
    before = titled()
    Application(backend="win32").connect(handle=root).window(handle=b).click_input()
    time.sleep(1.8)
    after = titled()
    form = None
    for h, (c, t, r) in after.items():
        if h in before: continue
        if c in ("DocAppWindow", "WndAppWindow", "#32770") and t.strip() == "Karyawan" and r[0] > 50:
            form = (h, c, t, r)
    if not form:
        for h, (c, t, r) in after.items():
            if c in ("#32770", "WndAppWindow") and t.strip() == "Karyawan" and r[0] > 50 and (r[2]-r[0]) < 1000:
                form = (h, c, t, r)
    if form:
        h, c, t, r = form
        pyautogui.screenshot().crop(r).save(os.path.join(OUT, "karyawan-form.png"))
        ctrls = dump(h)
        json.dump({"slug": "karyawan-form", "window_class": c, "title": t, "rect": list(r), "controls": ctrls},
                  open(os.path.join(OUT, "karyawan-form.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print("FORM ok", r, "controls", len(ctrls))
        for ct in ctrls:
            print("  ", ct["class"], repr(ct["text"]), ct["rect"])
        win32gui.PostMessage(h, 0x0010, 0, 0)
    else:
        print("FORM not detected; windows:", [(v[0], v[1]) for v in after.values()][:10])

    time.sleep(0.6)
    for h, (c, t, r) in titled().items():
        if c in ("DocAppWindow", "WndAppWindow", "#32770") and t and "Menu Utama" not in t and "GF-Akuntansi," not in t:
            win32gui.PostMessage(h, 0x0010, 0, 0)
    time.sleep(0.5)
    to_home(root)
    print("done; home")


if __name__ == "__main__":
    main()
