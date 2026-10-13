import sys, os, time, ctypes
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, gf

gf.set_dpi_aware(); ctypes.windll.shcore.SetProcessDpiAwareness(2)
root = gf.find_shell()["hwnd"]
WM_CLOSE = 0x0010; WM_COMMAND = 0x0111

def windows():
    out = {}
    def add(h, _=None):
        if h in out: return
        if win32gui.IsWindowVisible(h):
            out[h] = (win32gui.GetClassName(h), win32gui.GetWindowText(h).strip(), win32gui.GetWindowRect(h))
    win32gui.EnumWindows(add, None)
    win32gui.EnumChildWindows(root, add, None)
    return out

# close every form/dialog (keep shell + Menu Utama)
for _ in range(6):
    closed = False
    for h, (c, t, r) in windows().items():
        if c in ("DocAppWindow","WndAppWindow","#32770") and t and "Menu Utama" not in t and "GF-Akuntansi," not in t:
            try: win32gui.PostMessage(h, WM_CLOSE, 0, 0); closed = True
            except Exception: pass
    if not closed: break
    time.sleep(0.5)

# esc a few times, then show home
for _ in range(3):
    gf.press_esc(); time.sleep(0.3)
ctypes.windll.user32.SendMessageW(root, WM_COMMAND, 24514, 0); time.sleep(1.0)

btns = []
def cb(h, _):
    if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
        t = win32gui.GetWindowText(h).strip()
        if t: btns.append(t)
win32gui.EnumChildWindows(root, cb, None)
print("Menu Utama buttons:", btns[:15])
print("remaining non-menu windows:", [(t) for _, (c, t, r) in windows().items() if c in ("DocAppWindow","WndAppWindow","#32770") and t and "Menu Utama" not in t and "GF-Akuntansi," not in t])
