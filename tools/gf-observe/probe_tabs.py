import sys
import time
import ctypes
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import crop_menu_group_icons as c
from pywinauto.controls.common_controls import ListViewWrapper

u = ctypes.windll.user32


class TCITEMW(ctypes.Structure):
    _fields_ = [("mask", ctypes.c_uint), ("dwState", ctypes.c_uint), ("dwStateMask", ctypes.c_uint),
                ("pszText", ctypes.c_void_p), ("cchTextMax", ctypes.c_int), ("iImage", ctypes.c_int),
                ("lParam", ctypes.c_void_p)]


def dump(h, label):
    statics = sorted({cc["text"].strip() for cc in de.controls(h) if cc["class"] in ("Static", "CheckBox", "ComboBox") and cc["text"].strip() and cc["text"].strip() != "..."})
    print(f"   [{label}] statics:", [s[:38] for s in statics][:26], flush=True)
    lvs = []
    def cb(ch, _):
        if win32gui.GetClassName(ch) == "SysListView32":
            lvs.append(ch)
    win32gui.EnumChildWindows(h, cb, None)
    for x in lvs:
        try:
            w = ListViewWrapper(x)
            cols = [cc["text"] for cc in w.columns()]
            rows = [t for t in w.texts() if any(t)]
            print(f"   [{label}] LV", win32gui.GetWindowRect(x), "cols:", cols[:20], "rows:", len(rows), flush=True)
            for t in rows[:3]:
                print("        ", str(t)[:140], flush=True)
        except Exception as e:
            print("   lv err", e, flush=True)


def main():
    prefix = sys.argv[1]
    slug = sys.argv[2]
    h = next((hh for hh, t in de.all_named_windows().items() if t.startswith(prefix)), None)
    print("win:", h, (de.all_named_windows().get(h) if h else None), flush=True)
    if not h:
        return
    print("BUTTONS:", [(b["text"].replace("&", ""), b["rect"]) for b in de.buttons(h)][:20], flush=True)
    tabs = []
    def cbt(ch, _):
        if win32gui.GetClassName(ch) == "SysTabControl32":
            tabs.append(ch)
    win32gui.EnumChildWindows(h, cbt, None)
    if not tabs:
        print("(no tabctl)", flush=True)
        dump(h, "0")
        try:
            c.print_window(h).save(rf"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\{slug}-live.png")
            print("shot ok", flush=True)
        except Exception as e:
            print("shot err", e, flush=True)
    for t in tabs:
        n = u.SendMessageW(t, 0x1304, 0, 0)
        rect = win32gui.GetWindowRect(t)
        print("TABCTL n =", n, "rect:", rect, flush=True)
        for i in range(n):
            buf = ctypes.create_unicode_buffer(128)
            item = TCITEMW(); item.mask = 1; item.pszText = ctypes.addressof(buf); item.cchTextMax = 128
            u.SendMessageW(t, 0x133C, i, ctypes.byref(item))
            print("   tab", i, ":", ascii(buf.value), flush=True)
        for i in range(n):
            try:
                ctypes.windll.user32.SetForegroundWindow(h)
            except Exception:
                pass
            u.SendMessageW(t, 0x130B, i, 0)  # TCM_SETCURSEL
            u.SendMessageW(t, 0x130C, i, 0)  # TCM_SETCURFOCUS
            time.sleep(0.9)
            dump(h, f"tab{i}")
            try:
                c.print_window(h).save(rf"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\{slug}-tab{i}.png")
            except Exception as e:
                print("   shot err", e, flush=True)
    tb = next((b for b in de.buttons(h) if b["text"].replace("&", "").strip().lower() == "tutup"), None)
    if tb:
        win32gui.PostMessage(tb["hwnd"], 0x00F5, 0, 0)
        time.sleep(1)
        print("closed:", h not in de.all_named_windows(), flush=True)


if __name__ == "__main__":
    main()
