"""Dump isi list 'Fast Reports' (Lainnya > Fast Reports, id 24668).

Output: screens/lainnya-fast-reports.png + screens/lainnya-fast-reports.json
Jalankan saat window 'Fast Reports' terbuka.
"""
import time, json, os, ctypes
import win32gui, win32con
import pyautogui
from pywinauto import Application

OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
TITLE = "Fast Reports"


def main():
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass

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
    lv = dlg.child_window(class_name="SysListView32").wrapper_object()

    rows = lv.texts()
    cols = []
    try:
        cols = lv.column_texts()
    except Exception:
        pass

    ctrl = dlg.descendants()
    controls = []
    for c in ctrl:
        try:
            rect = c.rectangle()
            rect = [rect.left, rect.top, rect.right, rect.bottom]
        except Exception:
            rect = None
        controls.append(
            {"class": c.friendlyclassname, "text": c.window_text(), "rect": rect, "visible": c.is_visible()}
        )

    data = {"slug": "lainnya-fast-reports", "menu_id": 24668,
            "window": {"title": TITLE, "rect": [l, t, r, b]},
            "columns": cols, "rows_total": len(rows), "rows": rows, "controls": controls}
    with open(os.path.join(OUT, "lainnya-fast-reports.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"rows_total={len(rows)} cols={cols} controls={len(controls)}")
    for row in rows:
        print("  ", " | ".join(row))


if __name__ == "__main__":
    main()
