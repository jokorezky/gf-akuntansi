import sys, os, time, ctypes
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, gf, pyautogui
from pywinauto import Application

gf.set_dpi_aware()
ctypes.windll.shcore.SetProcessDpiAwareness(2)
root = gf.find_shell()["hwnd"]
win32gui.ShowWindow(root, 3); win32gui.SetForegroundWindow(root); time.sleep(0.4)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24514, 0); time.sleep(0.8)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24553, 0); time.sleep(1.6)

def find_button(text):
    hit = []
    def cb(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
            if text.lower() in win32gui.GetWindowText(h).lower().replace("&", ""):
                hit.append(h)
    win32gui.EnumChildWindows(root, cb, None)
    return hit[0] if hit else None

b = find_button("Tambah")
print("tambah hwnd:", b, win32gui.GetWindowRect(b) if b else None)
im0 = pyautogui.screenshot(); im0.save(r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\_before_tambah.png")
Application(backend="win32").connect(handle=root).window(handle=b).click_input()
time.sleep(2.0)
im1 = pyautogui.screenshot(); im1.save(r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\_after_tambah.png")
print("saved before/after")
# list windows
def cb2(h, _):
    if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) in ("DocAppWindow","WndAppWindow","#32770"):
        t = win32gui.GetWindowText(h) or ""
        if t:
            print("  win:", win32gui.GetClassName(h), repr(t), win32gui.GetWindowRect(h))
win32gui.EnumChildWindows(root, cb2, None)
