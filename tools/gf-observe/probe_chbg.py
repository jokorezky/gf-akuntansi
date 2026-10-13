import os
import sys
import time
import ctypes

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import crop_menu_group_icons as c

SHOTS = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
SLUGS = {24625: "cari-chbg-keluar", 24627: "pencairan-chbg-masuk", 24628: "pencairan-chbg-keluar"}


def click_button(hwnd_parent, name):
    tb = next((b for b in de.buttons(hwnd_parent) if b["text"].replace("&", "").strip().lower() == name), None)
    if not tb:
        return False
    win32gui = c.win32gui
    win32gui.ShowWindow(hwnd_parent, 9)
    ctypes.windll.user32.BringWindowToTop(hwnd_parent)
    win32gui.PostMessage(tb["hwnd"], 0x00F5, 0, 0)
    return True


def main():
    sh = de.shell()
    print("shell:", sh)
    for mid, slug in SLUGS.items():
        before = set(de.all_named_windows().keys())
        de.force_focus(sh)
        res = ctypes.c_size_t(0)
        ctypes.windll.user32.SendMessageTimeoutW(sh, 0x0111, mid, 0, 2, 8000, ctypes.byref(res))
        time.sleep(3)
        after = de.all_named_windows()
        neww = [(h, t) for h, t in after.items() if h not in before and not t.startswith("Online")]
        print(f"== {mid} {slug}: new windows:", [(h, t[:60]) for h, t in neww])
        target = None
        for h, t in neww:
            if t.strip() and t != "Menu Utama":
                target = h
                break
        if not target:
            cands = [(h, t) for h, t in after.items() if "CH/BG" in t or "Pencairan" in t]
            print("   cands:", cands)
            if cands:
                target = cands[0][0]
        if not target:
            print("   !! tidak ada window baru")
            continue
        print("   title:", de.win32gui.GetWindowText(target) if hasattr(de, "win32gui") else "", "cls:", after.get(target, "?"))
        import win32gui
        print("   TITLE:", win32gui.GetWindowText(target), "CLS:", win32gui.GetClassName(target))
        print("   BUTTONS:", [(b["text"].replace("&", ""), b["rect"]) for b in de.buttons(target)])
        statics = [cc["text"].strip() for cc in de.controls(target) if cc["class"] == "Static" and cc["text"].strip() and cc["text"].strip() != "..."]
        print("   STATICS:", [s[:40] for s in sorted(set(statics))][:22])
        try:
            from pywinauto.controls.common_controls import ListViewWrapper
            lvs = []
            def cb2(ch, _):
                if win32gui.GetClassName(ch) == "SysListView32":
                    lvs.append(ch)
            win32gui.EnumChildWindows(target, cb2, None)
            for x in lvs:
                w = ListViewWrapper(x)
                print("   LV", win32gui.GetWindowRect(x), [cc["text"] for cc in w.columns()][:22])
        except Exception as e:
            print("   lv err", e)
        try:
            img = c.print_window(target)
            img.save(os.path.join(SHOTS, f"{slug}-live.png"))
            print("   img:", img.size)
        except Exception as e:
            print("   img err", e)
        if click_button(target, "tutup"):
            time.sleep(1.5)
            print("   closed:", target not in de.all_named_windows())
        elif click_button(target, "batal"):
            time.sleep(1.5)
            print("   closed(batal):", target not in de.all_named_windows())
        else:
            print("   (tidak ketemu tombol tutup/batal)")


if __name__ == "__main__":
    main()
