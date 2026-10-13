import sys
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
from pywinauto.controls.common_controls import ListViewWrapper


def main():
    prefix = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    h = next((hh for hh, t in de.all_named_windows().items() if t.startswith(prefix)), None)
    print("win:", h, (de.all_named_windows().get(h) if h else None), flush=True)
    if not h:
        return
    lvs = []
    def cb(ch, _):
        if win32gui.GetClassName(ch) == "SysListView32":
            lvs.append(ch)
    win32gui.EnumChildWindows(h, cb, None)
    for x in lvs:
        w = ListViewWrapper(x)
        rows = [t for t in w.texts() if any(t)]
        print("LV", win32gui.GetWindowRect(x), "rows:", len(rows), flush=True)
        for t in rows[:n]:
            print("   ", str(t)[:200], flush=True)


if __name__ == "__main__":
    main()
