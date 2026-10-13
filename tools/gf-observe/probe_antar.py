import sys
import time
import ctypes
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import observe_screen2 as o2
from pywinauto.controls.common_controls import ListViewWrapper

u = ctypes.windll.user32


class TCITEMW(ctypes.Structure):
    _fields_ = [("mask", ctypes.c_uint), ("dwState", ctypes.c_uint), ("dwStateMask", ctypes.c_uint),
                ("pszText", ctypes.c_void_p), ("cchTextMax", ctypes.c_int), ("iImage", ctypes.c_int),
                ("lParam", ctypes.c_void_p)]


def main():
    mid = int(sys.argv[1]) if len(sys.argv) > 1 else 24632
    prefix = sys.argv[2] if len(sys.argv) > 2 else "Pembelian Antar Cabang"
    slug = sys.argv[3] if len(sys.argv) > 3 else "pembelian-antar-cabang"
    lst = o2.open_list(mid, prefix)
    print("list:", lst, flush=True)
    if not lst:
        return
    r = o2.click_tambah(lst)
    print("tambah:", r if not isinstance(r, tuple) else r[0], flush=True)
    form = r[1] if isinstance(r, tuple) else r
    if not form:
        print("form tidak terbuka", flush=True)
        return
    time.sleep(0.5)
    tabs = []
    def cbt(ch, _):
        if win32gui.GetClassName(ch) == "SysTabControl32":
            tabs.append(ch)
    win32gui.EnumChildWindows(form, cbt, None)
    for t in tabs:
        n = u.SendMessageW(t, 0x1304, 0, 0)
        print("TABCTL n =", n, "rect:", win32gui.GetWindowRect(t), flush=True)
        for i in range(n):
            buf = ctypes.create_unicode_buffer(128)
            item = TCITEMW(); item.mask = 1; item.pszText = ctypes.addressof(buf); item.cchTextMax = 128
            u.SendMessageW(t, 0x133C, i, ctypes.byref(item))
            print("   tab", i, ":", ascii(buf.value), flush=True)
    combos = []
    def cbc(ch, _):
        if win32gui.IsWindowVisible(ch) and win32gui.GetClassName(ch) == "ComboBox":
            combos.append(ch)
    win32gui.EnumChildWindows(form, cbc, None)
    for ch in combos:
        n = u.SendMessageW(ch, 0x0146, 0, 0)
        sel = u.SendMessageW(ch, 0x0147, 0, 0)
        t = win32gui.GetWindowText(ch)
        items = []
        for i in range(min(n, 14)):
            buf = ctypes.create_unicode_buffer(96)
            u.SendMessageW(ch, 0x0148, i, ctypes.byref(buf))
            items.append(buf.value)
        print("COMBO", win32gui.GetWindowRect(ch), "cur=", ascii(t)[:24], "sel", sel, items, flush=True)
    lvs = []
    def cb2(ch, _):
        if win32gui.GetClassName(ch) == "SysListView32":
            lvs.append(ch)
    win32gui.EnumChildWindows(form, cb2, None)
    for x in lvs:
        w = ListViewWrapper(x)
        print("LV", win32gui.GetWindowRect(x), [c2["text"] for c2 in w.columns()][:32], flush=True)
    try:
        import crop_menu_group_icons as c
        img = c.print_window(form)
        img.save(rf"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\{slug}-form-full.png")
        print("shot ok", flush=True)
    except Exception as e:
        print("shot err", e, flush=True)
    for b in de.buttons(form):
        if b["text"].replace("&", "").strip().lower() == "tutup":
            win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
            break
    time.sleep(0.6)
    print("closed:", form not in de.all_named_windows(), flush=True)


if __name__ == "__main__":
    main()
