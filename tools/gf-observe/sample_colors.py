"""Sample GF Akuntansi UI colours from a screenshot to seed DESIGN.md tokens.

Usage: python sample_colors.py <screenshot.png>
Prints named point samples + the most common quantized colours.
"""
import sys
from collections import Counter
from PIL import Image

POINTS = {
    "titlebar":        (960, 8),
    "menubar_bg":      (600, 47),
    "toolbar_bg":      (600, 80),
    "panel_bg":        (250, 900),
    "panel_header":    (240, 132),
    "group_label":     (60, 250),
    "content_bg":      (960, 300),
    "infobox_dark":    (1300, 720),
    "infobox_light":   (1750, 840),
    "statusbar_bg":    (900, 990),
}


def hexof(px):
    return "#%02X%02X%02X" % px[:3]


def main(path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    print(f"image {W}x{H}")
    print("== point samples ==")
    for name, (x, y) in POINTS.items():
        if 0 <= x < W and 0 <= y < H:
            print(f"{name:14} ({x},{y}) -> {hexof(im.getpixel((x, y)))}")
    print("== top colours (quantized 16) ==")
    small = im.resize((W // 4, H // 4))
    q = small.quantize(colors=16, method=Image.MEDIANCUT).convert("RGB")
    c = Counter(q.getdata())
    for color, n in c.most_common(16):
        pct = 100 * n / (q.size[0] * q.size[1])
        print(f"{hexof(color)}  {pct:5.1f}%")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else r"D:\Projects\gf-akuntansi-explorer\output\screens\fullscreen.png")
