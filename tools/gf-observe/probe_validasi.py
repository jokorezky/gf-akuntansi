import sys
import time
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
from pywinauto.controls.common_controls import ListViewWrapper


def main():
    prefix = sys.argv[1] if len(sys.argv) > 1 else "Validasi Barang Keluar"
    h = next((hh for hh, t in de.all_named_windows().items() if t.startswith(prefix)), None)
    print("win:", h, (de.all_named_windows().get(h) if h else None), flush=True)
    if not h:
        return
    print("RECT:", win32gui.GetWindowRect(h), flush=True)
    for cc in de.controls(h):
        if cc["text"].strip() and cc["class"] in ("Static", "Edit", "ComboBox", "CheckBox", "Button"):
            print(cc["class"], ascii(cc["text"].strip())[:60], cc["rect"], flush=True)
    lvs = []
    def cb(ch, _):
        if win32gui.GetClassName(ch) == "SysListView32":
            lvs.append(ch)
    win32gui.EnumChildWindows(h, cb, None)
    for x in lvs:
        w = ListViewWrapper(x)
        cols = [cc["text"] for cc in w.columns()]
        rows = [t for t in w.texts() if any(t)]
        print("LV", win32gui.GetWindowRect(x), "cols:", cols[:32], flush=True)
        print("   rows:", len(rows), flush=True)
        for t in rows[:4]:
            print("   ", str(t)[:200], flush=True)


if __name__ == "__main__":
    main()
