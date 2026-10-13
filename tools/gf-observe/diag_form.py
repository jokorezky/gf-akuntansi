import sys, os, time, ctypes
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, gf, pyautogui
from pywinauto import Application
import win32process

gf.set_dpi_aware(); ctypes.windll.shcore.SetProcessDpiAwareness(2)
root = gf.find_shell()["hwnd"]
_, gfpid = win32process.GetWindowThreadProcessId(root)
win32gui.ShowWindow(root, 3); win32gui.SetForegroundWindow(root); time.sleep(0.4)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24553, 0); time.sleep(1.6)

def find_button(text):
    hit = []
    def cb(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
            if text.lower() in win32gui.GetWindowText(h).lower().replace("&",""):
                hit.append(h)
    win32gui.EnumChildWindows(root, cb, None)
    return hit[0] if hit else None

b = find_button("Tambah")
Application(backend="win32").connect(handle=root).window(handle=b).click_input()
time.sleep(2.0)
print("== windows of GF pid", gfpid, "==")
def cb(h, _):
    try:
        _, pid = win32process.GetWindowThreadProcessId(h)
    except Exception:
        return
    if pid == gfpid and win32gui.IsWindowVisible(h):
        c = win32gui.GetClassName(h); t = win32gui.GetWindowText(h); r = win32gui.GetWindowRect(h)
        if r[2]-r[0] > 20 and r[3]-r[1] > 20:
            print(f"  TOP [{c}] {t!r} {r}")
win32gui.EnumWindows(cb, None)
print("== shell children ==")
def cb2(h, _):
    if win32gui.IsWindowVisible(h):
        c = win32gui.GetClassName(h); t = win32gui.GetWindowText(h); r = win32gui.GetWindowRect(h)
        if c in ("#32770","WndAppWindow","DocAppWindow","Static","Edit","ComboBox","Button") and (t or c in ("#32770","Edit","ComboBox")):
            print(f"  CHILD [{c}] {t!r} {r}")
win32gui.EnumChildWindows(root, cb2, None)
pyautogui.screenshot().save(r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\_karyawan_form_dbg.png")
