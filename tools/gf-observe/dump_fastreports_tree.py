"""Dump isi tree 'Fast Reports' (Lainnya > Fast Reports, id 24668).

Output: screens/lainnya-fast-reports.png + screens/lainnya-fast-reports-tree.json
Jalankan saat window 'Fast Reports' terbuka.
"""
import time, json, os
import win32gui, win32con
import pyautogui
from pywinauto import Application

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
TITLE = "Fast Reports"


def main():
    hwnd = win32gui.FindWindow(None, TITLE)
    assert hwnd, "window 'Fast Reports' tidak ditemukan"
    win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
    win32gui.SetForegroundWindow(hwnd)
    time.sleep(0.5)

    l, t, r, b = win32gui.GetWindowRect(hwnd)
    pyautogui.screenshot(region=(l, t, r - l, b - t)).save(
        os.path.join(OUT, "lainnya-fast-reports.png"))

    app = Application(backend="win32").connect(handle=hwnd)
    dlg = app.window(handle=hwnd)
    tv = dlg.child_window(class_name="SysTreeView32").wrapper_object()

    rows = []

    def walk(el, depth):
        rows.append({"depth": depth, "text": el.text()})
        for c in el.children():
            walk(c, depth + 1)

    for root in tv.roots():
        walk(root, 0)

    ctrl = dlg.descendants()
    controls = [
        {"class": c.friendlyclassname, "text": c.window_text(), "rect": list(c.rectangle())}
        for c in ctrl if c.is_visible()
    ]

    data = {"slug": "lainnya-fast-reports", "menu_id": 24668,
            "window": {"title": TITLE, "rect": [l, t, r, b]},
            "tree_total": len(rows), "tree": rows, "controls": controls}
    with open(os.path.join(OUT, "lainnya-fast-reports-tree.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"tree_total={len(rows)} controls={len(controls)}")
    for row in rows[:80]:
        print("  " * row["depth"] + row["text"])


if __name__ == "__main__":
    main()
