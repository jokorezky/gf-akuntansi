"""Capture Sisa Stock 1:1 + auto-recovery bila GF terblokir mode 'proses laporan'.

Output: screens/sisa-stock-live.png + daftar tombol + header kolom grid.
"""
import os, sys, time, ctypes, subprocess
import win32gui
import pyautogui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import crop_menu_group_icons as c

SHOTS = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
EXE = r"D:\GF Akuntansi\GF Akuntansi.exe"


def click_button_text(hwnd, *want):
    for b in de.buttons(hwnd):
        t = b["text"].replace("&", "").strip().lower()
        if t in want:
            win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
            return b["text"]
    return None


def close_error_if_any():
    for h, t in de.all_named_windows().items():
        if t.strip() == "Error":
            click_button_text(h, "ok", "tutup")
            time.sleep(0.5)
            return True
    return False


def launcher_flow():
    # cari window launcher (#32770 'GF-Akuntansi')
    launcher = None
    for h, t in [(h, win32gui.GetWindowText(h)) for h in []]:
        pass
    def add(h, _):
        nonlocal launcher
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "#32770" and win32gui.GetWindowText(h).strip() == "GF-Akuntansi":
            launcher = h
    win32gui.EnumWindows(add, None)
    if not launcher:
        return False
    win32gui.ShowWindow(launcher, 9)
    ctypes.windll.user32.BringWindowToTop(launcher)
    ctypes.windll.user32.SetWindowPos(launcher, -1, 0, 0, 0, 0, 0x0003)
    time.sleep(0.6)
    # centang perjanjian
    for b in de.buttons(launcher):
        if "setuju" in b["text"].lower():
            win32gui.SendMessage(b["hwnd"], 0x00F5, 0, 0)
            break
    time.sleep(0.4)
    # klik 'Buka Data'
    target = None
    def cb(ch, _):
        nonlocal target
        buf = ctypes.create_unicode_buffer(128)
        ctypes.windll.user32.SendMessageW(ch, 0x000D, 128, ctypes.byref(buf))
        if buf.value.strip() == "Buka Data":
            target = ch
    win32gui.EnumChildWindows(launcher, cb, None)
    if not target:
        return False
    r = win32gui.GetWindowRect(target)
    pyautogui.click((r[0] + r[2]) // 2, (r[1] + r[3]) // 2)
    time.sleep(8)
    # EULA?
    for h, t in de.all_named_windows().items():
        if "Licensing End-User" in t:
            win32gui.ShowWindow(h, 9)
            ctypes.windll.user32.BringWindowToTop(h)
            time.sleep(0.5)
            b = click_button_text(h, "setuju", "&ok", "ok", "ya")
            if not b:
                pyautogui.press("enter")
            time.sleep(5)
    # tunggu shell
    for _ in range(20):
        time.sleep(1.5)
        if de.shell():
            return True
    return False


def main():
    # 1) bersihkan Proses Laporan bila ada (klik Batal)
    for h, t in de.all_named_windows().items():
        if t.startswith("Proses Laporan"):
            click_button_text(h, "batal")
            time.sleep(0.8)
            click_button_text(h, "tutup")
            time.sleep(0.5)
    de.cleanup_forms()
    sh = de.shell()
    if not sh:
        print("shell tidak ada; coba launcher")
        launcher_flow()
        sh = de.shell()
    assert sh, "GF shell tidak ditemukan"
    de.force_focus(sh)
    res = ctypes.c_size_t(0)
    ctypes.windll.user32.SendMessageTimeoutW(sh, 0x0111, 24559, 0, 2, 8000, ctypes.byref(res))
    time.sleep(2.5)

    if close_error_if_any():
        print("BLOCKED: restart GF...")
        subprocess.run(["taskkill", "/F", "/IM", "GF Akuntansi.VO.exe"], capture_output=True)
        time.sleep(2)
        os.startfile(EXE)
        time.sleep(12)
        ok = launcher_flow()
        print("launcher ok:", ok)
        sh = de.shell()
        assert sh, "GF gagal restart"
        de.force_focus(sh)
        res = ctypes.c_size_t(0)
        ctypes.windll.user32.SendMessageTimeoutW(sh, 0x0111, 24559, 0, 2, 8000, ctypes.byref(res))
        time.sleep(2.5)
        if close_error_if_any():
            print("MASIH BLOCKED — stop")
            return 1

    lst = next((h for h, t in de.all_named_windows().items() if t.startswith("Sisa Stock - GF")), None)
    print("list:", lst)
    assert lst, "window Sisa Stock tidak ditemukan"
    img = c.print_window(lst)
    img.save(os.path.join(SHOTS, "sisa-stock-live.png"))
    print("img:", img.size)
    print("BUTTONS:")
    for b in de.buttons(lst):
        print("  ", ascii(b["text"].replace("&", ""))[:30], b["rect"])
    lv = [x for x in de.controls(lst) if x["class"] == "SysListView32"]
    hd = [x for x in de.controls(lst) if x["class"] == "SysHeader32"]
    print("listviews:", len(lv), "headers:", len(hd))
    from pywinauto.controls.common_controls import ListViewWrapper
    if lv:
        w = ListViewWrapper(lv[0]["hwnd"])
        try:
            print("columns:", [h_["text"] for h_ in w.columns()])
        except Exception as e:
            print("cols err", e)
        try:
            rows = w.texts()
            print("rows:", len(rows))
            for r in rows[:5]:
                print("   ", r)
        except Exception as e:
            print("rows err", e)
    return 0


if __name__ == "__main__":
    sys.exit(main())
