"""Navigasi/inspeksi GF via Win32 murni dengan PostMessage (tidak memblokir).

Perintah:
  python gf_nav.py open <menu_id>
  python gf_nav.py windows
  python gf_nav.py click <window_title_substr> <button_text_substr>
  python gf_nav.py close <window_title_substr>
  python gf_nav.py dump <window_title_substr> <out_slug> [--shot]

Semua aksi pakai PostMessage supaya dialog modal tidak membuat hang.
Output dump: screens/<slug>.json (+ <slug>.png dengan --shot).
"""
import sys, os, time, json, ctypes
import win32gui
import pyautogui

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
SHELL_TITLE = "GF-Akuntansi, Release : 951.1823 Build 2026.06.28"
WM_COMMAND = 0x0111
BM_CLICK = 0x00F5
WM_CLOSE = 0x0010
FORM_CLASSES = ("DocAppWindow", "WndAppWindow", "#32770")


def dpi_aware():
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass


def shell():
    return win32gui.FindWindow(None, SHELL_TITLE)


def find_windows(sub):
    res = []

    def add(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            if t and sub.lower() in t.lower():
                res.append(h)
    win32gui.EnumWindows(add, None)
    sh = shell()
    if sh:
        def add2(h, _):
            if win32gui.IsWindowVisible(h):
                t = win32gui.GetWindowText(h)
                if t and sub.lower() in t.lower():
                    res.append(h)
        win32gui.EnumChildWindows(sh, add2, None)
    seen, uniq = set(), []
    for h in res:
        if h not in seen:
            seen.add(h)
            uniq.append(h)
    return uniq


def controls(hwnd):
    rows = []

    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            rows.append({
                "hwnd": h,
                "class": win32gui.GetClassName(h),
                "text": win32gui.GetWindowText(h),
                "rect": list(win32gui.GetWindowRect(h)),
            })
    win32gui.EnumChildWindows(hwnd, cb, None)
    return rows


def print_window(w):
    print(f"WIN {w} {win32gui.GetClassName(w)!r} {win32gui.GetWindowText(w)!r} {win32gui.GetWindowRect(w)}")


def print_forms():
    sh = shell()
    print("shell:", sh)
    def cb(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) in FORM_CLASSES:
            print_window(h)
    win32gui.EnumChildWindows(sh, cb, None)


def cmd_open(mid):
    sh = shell()
    # fokuskan dulu — GF mengabaikan WM_COMMAND saat tidak aktif
    win32gui.ShowWindow(sh, 3)  # SW_MAXIMIZE
    try:
        win32gui.SetForegroundWindow(sh)
    except Exception:
        pass
    time.sleep(0.6)
    before = set(find_windows(""))
    user32 = ctypes.windll.user32
    res = ctypes.c_size_t(0)
    # SMTO_ABORTIFHUNG(2)|SMTO_NORMAL(0); timeout 8s supaya tidak hang selamanya
    user32.SendMessageTimeoutW(sh, WM_COMMAND, int(mid), 0, 2, 8000, ctypes.byref(res))
    time.sleep(1.5)
    print_forms()
    after = set(find_windows(""))
    neww = [h for h in after - before if win32gui.GetWindowText(h)]
    if neww:
        print("--- window baru ---")
        for h in neww:
            print_window(h)


def cmd_windows():
    print("--- top-level bertitle ---")
    def add(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            if t:
                print_window(h)
    win32gui.EnumWindows(add, None)
    print("--- form anak shell ---")
    print_forms()


def cmd_click(sub, btn):
    wins = find_windows(sub)
    if not wins:
        print("window tidak ditemukan:", sub)
        return 1
    w = wins[0]
    print_window(w)
    hit = None
    for c in controls(w):
        if c["class"] == "Button" and btn.lower() in c["text"].lower():
            hit = c
            break
    if not hit:
        print("tombol tidak ditemukan:", btn)
        for c in controls(w):
            if c["class"] == "Button":
                print("  btn:", repr(c["text"]), c["rect"])
        return 1
    win32gui.PostMessage(hit["hwnd"], BM_CLICK, 0, 0)
    print("clicked:", repr(hit["text"]), hit["hwnd"])
    return 0


def cmd_close(sub):
    wins = find_windows(sub)
    if not wins:
        print("window tidak ditemukan:", sub)
        return 1
    for w in wins:
        win32gui.PostMessage(w, WM_CLOSE, 0, 0)
        print("closed", w, repr(win32gui.GetWindowText(w)))
    return 0


def cmd_dump(sub, slug, shot=False):
    wins = find_windows(sub)
    if not wins:
        print("window tidak ditemukan:", sub)
        return 1
    w = max(wins, key=lambda h: (lambda r: (r[2] - r[0]) * (r[3] - r[1]))(win32gui.GetWindowRect(h)))
    print_window(w)
    rows = controls(w)
    data = {"slug": slug, "window": {
        "hwnd": w, "class": win32gui.GetClassName(w),
        "title": win32gui.GetWindowText(w),
        "rect": list(win32gui.GetWindowRect(w)),
    }, "controls": rows}
    with open(os.path.join(OUT, slug + ".json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    if shot:
        win32gui.ShowWindow(w, 3)
        ctypes.windll.user32.BringWindowToTop(w)
        ctypes.windll.user32.SetWindowPos(w, -1, 0, 0, 0, 0, 0x0003)  # HWND_TOPMOST, NOMOVE|NOSIZE
        time.sleep(0.5)
        l, t, r, b = win32gui.GetWindowRect(w)
        pyautogui.screenshot(region=(l, t, r - l, b - t)).save(os.path.join(OUT, slug + ".png"))
    print(f"dumped {len(rows)} controls -> {slug}.json")
    for c in rows:
        if c["class"] in ("Button", "SysListView32", "Edit", "ComboBox", "Static", "SysTreeView32", "SysHeader32"):
            print(f"  [{c['class']}] {c['text']!r} {c['rect']}")
    return 0


def main():
    dpi_aware()
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    c = sys.argv[1]
    if c == "open":
        cmd_open(sys.argv[2])
    elif c == "windows":
        cmd_windows()
    elif c == "click":
        return cmd_click(sys.argv[2], sys.argv[3])
    elif c == "close":
        return cmd_close(sys.argv[2])
    elif c == "dump":
        return cmd_dump(sys.argv[2], sys.argv[3], "--shot" in sys.argv)
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
