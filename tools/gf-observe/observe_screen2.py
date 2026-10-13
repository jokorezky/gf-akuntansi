"""Observe generik layar GF: list (PrintWindow + tombol) -> form Tambah (tabs + PrintWindow/tab).

Usage: python observe_screen2.py <menu_id> <slug> <list_title_prefix>
Output: screens/<slug>-list-live.png, <slug>-form-tab0.png, <slug>-form-tabN.png,
        prints tombol list + teks per tab.
"""
import os, sys, time, ctypes
import win32gui
import pyautogui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import crop_menu_group_icons as c

SHOTS = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
EXE = r"D:\GF Akuntansi\GF Akuntansi.exe"


def error_text(hwnd):
    txt = []
    def cb(ch, _):
        if win32gui.IsWindowVisible(ch) and win32gui.GetClassName(ch) == "Static":
            b = ctypes.create_unicode_buffer(1024)
            ctypes.windll.user32.SendMessageW(ch, 0x000D, 1024, ctypes.byref(b))
            if b.value.strip():
                txt.append(b.value.strip())
    win32gui.EnumChildWindows(hwnd, cb, None)
    return " | ".join(txt)


def close_error():
    h = win32gui.FindWindow(None, "Error")
    if not h:
        return None
    t = error_text(h)
    for b in de.buttons(h):
        if b["text"].replace("&", "").strip().lower() in ("ok", "tutup"):
            win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
            break
    time.sleep(0.6)
    return t


def restart_gf():
    import subprocess
    import capture_sisa_stock as css
    subprocess.run(["taskkill", "/F", "/IM", "GF Akuntansi.VO.exe"], capture_output=True)
    time.sleep(2)
    os.startfile(EXE)
    time.sleep(12)
    ok = css.launcher_flow()
    print("restart GF, launcher ok:", ok)
    return de.shell()


def open_list(mid, prefix):
    sh = de.shell()
    de.force_focus(sh)
    res = ctypes.c_size_t(0)
    ctypes.windll.user32.SendMessageTimeoutW(sh, 0x0111, mid, 0, 2, 8000, ctypes.byref(res))
    time.sleep(2.5)
    err = close_error()
    if err:
        print("open_list error:", err)
        return None
    return next((h for h, t in de.all_named_windows().items() if t.startswith(prefix)), None)


def click_tambah(lst):
    tb = next((b for b in de.buttons(lst) if b["text"].replace("&", "").strip().lower() == "tambah"), None)
    if not tb:
        return None
    win32gui.ShowWindow(lst, 9)
    ctypes.windll.user32.BringWindowToTop(lst)
    ctypes.windll.user32.SetWindowPos(lst, -1, 0, 0, 0, 0, 0x0003)
    time.sleep(0.5)
    before = set(de.all_named_windows().keys())
    win32gui.PostMessage(tb["hwnd"], 0x00F5, 0, 0)
    for _ in range(12):
        time.sleep(0.8)
        after = de.all_named_windows()
        neww = [(h, t) for h, t in after.items() if h not in before]
        if neww:
            errh = [h for h, t in neww if t.strip() == "Error"]
            if errh:
                return ("error", error_text(errh[0]))
            cands = [h for h, t in neww if t.strip() != "Error" and not t.startswith("Online")]
            if cands:
                return ("form", cands[0])
    return None


def main():
    mid = int(sys.argv[1])
    slug = sys.argv[2]
    list_prefix = sys.argv[3]

    if not de.shell():
        restart_gf()
    de.cleanup_forms()
    lst = open_list(mid, list_prefix)
    if not lst:
        print("list tidak ditemukan; restart + retry")
        restart_gf()
        lst = open_list(mid, list_prefix)
    print("list:", lst)
    if not lst:
        print("windows:", [(h, t[:50]) for h, t in de.all_named_windows().items()])
        return 1
    img = c.print_window(lst)
    img.save(os.path.join(SHOTS, f"{slug}-list-live.png"))
    print("list img:", img.size)
    print("LIST BUTTONS:")
    for b in de.buttons(lst):
        print("  ", ascii(b["text"].replace("&", ""))[:30], b["rect"])

    form = None
    for attempt in range(3):
        r = click_tambah(lst)
        if isinstance(r, tuple) and r[0] == "form":
            form = r[1]
            break
        if isinstance(r, tuple) and r[0] == "error":
            print("tambah error:", r[1][:100])
            if "proses" in r[1]:
                print(">> mode proses terdeteksi: restart GF + launcher flow")
                lst = restart_gf() and open_list(mid, list_prefix)
                if not lst:
                    return 1
            else:
                close_error()
                break
        else:
            print("tambah tidak membuka apa-apa")
            break
    print("form:", form)
    if not form:
        print("!! form tidak terbuka")
        return 1
    fi = c.print_window(form)
    fi.save(os.path.join(SHOTS, f"{slug}-form-tab0.png"))
    txts = sorted({cc["text"].strip() for cc in de.controls(form) if cc["text"].strip()
                   and cc["class"] in ("Static", "CheckBox", "ComboBox")})
    print("== tab0:", " | ".join(ascii(x)[1:-1][:28] for x in txts[:28]))
    tabs = [cc for cc in de.controls(form) if cc["class"] == "SysTabControl32"]
    if tabs:
        x1, y1, x2, y2 = tabs[0]["rect"]
        n = int(os.environ.get("N_TABS", "6"))
        for k in range(1, n):
            cx = int(x1 + (k + 0.5) * (x2 - x1) / n)
            pyautogui.click(cx, y1 + 14)
            time.sleep(1.2)
            fi = c.print_window(form)
            fi.save(os.path.join(SHOTS, f"{slug}-form-tab{k}.png"))
            txts2 = sorted({cc["text"].strip() for cc in de.controls(form) if cc["text"].strip()
                            and cc["class"] in ("Static", "CheckBox", "ComboBox")})
            print(f"== tab{k}:", " | ".join(ascii(x)[1:-1][:26] for x in txts2[:24]))
    for b in de.buttons(form):
        if b["text"].replace("&", "").strip().lower() == "tutup":
            win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
            break
    return 0


if __name__ == "__main__":
    sys.exit(main())
