import sys
import time
import ctypes
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import crop_menu_group_icons as c
from pywinauto.controls.common_controls import ListViewWrapper


def find(prefix):
    return next((h for h, t in de.all_named_windows().items() if t.startswith(prefix)), None)


def dump_lvs(h):
    lvs = []
    def cb(ch, _):
        if win32gui.GetClassName(ch) == "SysListView32":
            lvs.append(ch)
    win32gui.EnumChildWindows(h, cb, None)
    for x in lvs:
        try:
            w = ListViewWrapper(x)
            print("   LV", win32gui.GetWindowRect(x), [cc["text"] for cc in w.columns()][:30], flush=True)
        except Exception as e:
            print("   lv err", e, flush=True)


def main():
    prefix = sys.argv[1] if len(sys.argv) > 1 else "Barang UnTransfer"
    slug = sys.argv[2] if len(sys.argv) > 2 else "barang-untransfer"
    lst = find(prefix)
    print("list:", lst, de.win32gui.GetWindowText(lst) if lst else "", flush=True)
    if not lst:
        print("list tidak ada", flush=True)
        return
    print("LIST BUTTONS:", [(b["text"].replace("&", ""), b["rect"]) for b in de.buttons(lst)], flush=True)
    dump_lvs(lst)
    c.print_window(lst).save(rf"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\{slug}-list-live.png")
    tb = next((b for b in de.buttons(lst) if b["text"].replace("&", "").strip().lower() == "tambah"), None)
    if tb:
        win32gui.ShowWindow(lst, 9)
        ctypes.windll.user32.BringWindowToTop(lst)
        time.sleep(0.4)
        before = set(de.all_named_windows().keys())
        win32gui.PostMessage(tb["hwnd"], 0x00F5, 0, 0)
        form = None
        for _ in range(10):
            time.sleep(0.8)
            after = de.all_named_windows()
            neww = [(h, t) for h, t in after.items() if h not in before and t != "Online" and t != "Menu Utama"]
            if neww:
                form = neww[0][0]
                break
        print("form:", form, (de.all_named_windows().get(form) if form else None), flush=True)
        if form:
            time.sleep(0.5)
            print("FORM TITLE:", win32gui.GetWindowText(form), flush=True)
            print("FORM BUTTONS:", [(b["text"].replace("&", ""), b["rect"]) for b in de.buttons(form)], flush=True)
            statics = [cc["text"].strip() for cc in de.controls(form) if cc["class"] == "Static" and cc["text"].strip() and cc["text"].strip() != "..."]
            print("FORM STATICS:", sorted(set(statics))[:26], flush=True)
            dump_lvs(form)
            try:
                c.print_window(form).save(rf"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\{slug}-form-live.png")
                print("shot ok", flush=True)
            except Exception as e:
                print("shot err", e, flush=True)
            for b in de.buttons(form):
                if b["text"].replace("&", "").strip().lower() == "tutup":
                    win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
                    break
            time.sleep(0.8)
            print("form closed:", form not in de.all_named_windows(), flush=True)


if __name__ == "__main__":
    main()
