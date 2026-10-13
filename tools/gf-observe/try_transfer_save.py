import sys
import time
import ctypes
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import observe_screen2 as o2

u = ctypes.windll.user32


def main():
    lst = next((h for h, t in de.all_named_windows().items() if t.startswith("Barang Transfer")), None)
    print("list:", lst, flush=True)
    if not lst:
        return
    tb = next((b for b in de.buttons(lst) if b["text"].replace("&", "").strip().lower() == "tambah"), None)
    win32gui.ShowWindow(lst, 9)
    ctypes.windll.user32.BringWindowToTop(lst)
    time.sleep(0.4)
    before = set(de.all_named_windows().keys())
    win32gui.PostMessage(tb["hwnd"], 0x00F5, 0, 0)
    form = None
    for _ in range(10):
        time.sleep(0.8)
        neww = [(h, t) for h, t in de.all_named_windows().items() if h not in before and t not in ("Online", "Menu Utama")]
        if neww:
            form = neww[0][0]
            break
    print("form:", form, (de.all_named_windows().get(form) if form else None), flush=True)
    if not form:
        return
    time.sleep(0.5)
    edits = []
    def ce(ch, _):
        if win32gui.IsWindowVisible(ch) and win32gui.GetClassName(ch) == "Edit":
            edits.append((win32gui.GetWindowRect(ch), ch))
    win32gui.EnumChildWindows(form, ce, None)
    edits.sort(key=lambda e: (e[0][1], e[0][0]))
    for r, hw in edits:
        print("EDIT", r, ascii(win32gui.GetWindowText(hw))[:30], flush=True)
    statics = [(cc["text"].strip(), cc["rect"]) for cc in de.controls(form) if cc["class"] == "Static" and cc["text"].strip()]
    for s, r in statics:
        print("ST", ascii(s)[:40], r, flush=True)
    # isi edit pertama yang kira-kira Jumlah (150x24, row y~150-190 area): pakai edit terbesar kedua?
    if edits:
        target = edits[0][1]
        for r, hw in edits:
            if 100 < (r[1] - win32gui.GetWindowRect(form)[1]) < 260 and (r[2] - r[0]) > 90:
                target = hw
                break
        u.SendMessageW(target, 0x000C, 0, ctypes.c_wchar_p("3"))
        print("set jumlah on", win32gui.GetWindowRect(target), flush=True)
    time.sleep(0.3)
    sb = next((b for b in de.buttons(form) if b["text"].replace("&", "").strip().lower() == "simpan"), None)
    print("simpan btn:", sb and sb["enabled"], flush=True)
    if sb:
        win32gui.PostMessage(sb["hwnd"], 0x00F5, 0, 0)
        time.sleep(2)
    wins = de.all_named_windows()
    print("windows now:", [(h, t[:50]) for h, t in wins.items() if h == form or t.strip() == "Error"], flush=True)
    err = next((h for h, t in wins.items() if t.strip() == "Error"), None)
    if err:
        print("ERR TEXT:", repr(o2.error_text(err))[:400], flush=True)
        o2.close_error()
    st2 = [cc["text"].strip() for cc in de.controls(form) if cc["class"] == "Static" and cc["text"].strip()]
    print("status statics:", [s for s in st2 if "belum" in s.lower() or "berhasil" in s.lower() or "tersimpan" in s.lower() or "!" in s][:6], flush=True)
    tb2 = next((b for b in de.buttons(form) if b["text"].replace("&", "").strip().lower() == "tutup"), None)
    if tb2:
        win32gui.PostMessage(tb2["hwnd"], 0x00F5, 0, 0)
        time.sleep(1)
    print("form closed:", form not in de.all_named_windows(), flush=True)


if __name__ == "__main__":
    main()
