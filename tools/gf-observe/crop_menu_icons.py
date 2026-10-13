"""Crop the 12 Menu Utama button tiles out of the GF screenshot -> web assets.

Coordinates are the Button control rects reported by Win32 (screen space);
the capture is the whole ShellWindow whose top-left is (-12,-12), so add 12.
"""
import os
from PIL import Image

SRC = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\gf-menuutama.png"
OUT = r"D:\Projects\gf-akuntansi-clone\apps\web\public\gf-icons"
OFF = 12
TILES = [
    ("aplikasi",     (29, 209, 167, 370)),
    ("sistem-setup", (173, 209, 311, 370)),
    ("master-file",  (317, 209, 455, 370)),
    ("pembelian",    (29, 381, 167, 545)),
    ("penjualan",    (173, 381, 311, 545)),
    ("antar-cabang", (317, 381, 455, 545)),
    ("kas",          (29, 549, 167, 710)),
    ("gl",           (173, 549, 311, 710)),
    ("lainnya",      (317, 549, 455, 710)),
    ("bantuan",      (29, 723, 167, 887)),
    ("log-off",      (173, 723, 311, 887)),
    ("exit",         (317, 723, 455, 887)),
]

os.makedirs(OUT, exist_ok=True)
im = Image.open(SRC).convert("RGB")
for name, (l, t, r, b) in TILES:
    box = (l + OFF, t + OFF, r + OFF, b + OFF)
    im.crop(box).save(os.path.join(OUT, name + ".png"))
    print("saved", name, box)
print("done", len(TILES))
