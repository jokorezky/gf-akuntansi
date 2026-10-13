"""Crop Menu Utama tiles from a FULL-SCREEN shot (screen coords == control rects)."""
import os, sys, time, ctypes
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui
import gf
import pyautogui
from PIL import Image

OUT = r"D:\Projects\gf-akuntansi-clone\apps\web\public\gf-icons"
TMP = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\_live_menu.png"
SLUG = {
    "Aplikasi": "aplikasi", "Sistem Setup": "sistem-setup", "Master File": "master-file",
    "Pembelian": "pembelian", "Penjualan": "penjualan", "Antar Cabang": "antar-cabang",
    "Kas": "kas", "GL": "gl", "Lainnya": "lainnya",
    "Bantuan": "bantuan", "Log Off": "log-off", "Exit": "exit",
}

gf.set_dpi_aware()
ctypes.windll.shcore.SetProcessDpiAwareness(2)
root = gf.find_shell()["hwnd"]
win32gui.ShowWindow(root, 3)  # maximize
win32gui.SetForegroundWindow(root)
time.sleep(0.4)
# ensure Menu Utama box visible (toggle twice to be safe)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24514, 0); time.sleep(1.2)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24514, 0); time.sleep(1.5)

ctypes.windll.user32.SetForegroundWindow(root)
time.sleep(0.6)
im = pyautogui.screenshot()  # full screen, physical px
im.save(TMP)
print("screen:", im.size)

found = {}
def cb2(h, _):
    if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "Button":
        t = win32gui.GetWindowText(h).strip()
        if t in SLUG:
            found[t] = win32gui.GetWindowRect(h)
win32gui.EnumChildWindows(root, cb2, None)
print("found:", len(found))

os.makedirs(OUT, exist_ok=True)
for label, (l, t, r, b) in found.items():
    im.crop((l, t, r, b)).save(os.path.join(OUT, SLUG[label] + ".png"))
    print("saved", SLUG[label], (l, t, r, b))
