"""V5 Shortcut Audit — deep test tombol/hotkey di GF (aman: ESC/close tiap efek).

Protokol aman:
- Alt+F4 / F10 / F12 TIDAK ditekan (label sudah jadi bukti; anti polusi data).
- Ctrl+P ditekan hanya di tunjukkan dialog -> langsung ditutup.
- Setiap dialog/jendela baru yang muncul = direkam lalu dibersihkan (ESC -> WM_CLOSE).
"""
import ctypes
import json
import os
import sys
import time
import win32con
import win32gui

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import observe_screen2 as o2
import crop_menu_group_icons as c

u = ctypes.windll.user32
SHOTS = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\shortcuts"
os.makedirs(OUT, exist_ok=True)

SKIP_KEYS = {"F10", "F12", "Alt+F4"}

KEYS = (
    [f"F{i}" for i in range(1, 13)]
    + [f"Ctrl+F{i}" for i in range(1, 13)]
    + ["Ctrl+H", "Ctrl+P", "Ctrl+M", "Ctrl+K", "Ctrl+S", "Ctrl+E", "Ctrl+U", "Ctrl+F5", "Ctrl+F7", "Ctrl+F8", "Alt+F10"]
)

VK = {
    "F1": 0x70, "F2": 0x71, "F3": 0x72, "F4": 0x73, "F5": 0x74, "F6": 0x75, "F7": 0x76, "F8": 0x77,
    "F9": 0x78, "F10": 0x79, "F11": 0x7A, "F12": 0x7B, "ESC": 0x1B,
    "H": 0x48, "P": 0x50, "M": 0x4D, "K": 0x4B, "S": 0x53, "E": 0x45, "U": 0x55,
}
VK_F = {f"F{i}": 0x6F + i for i in range(1, 13)}  # F1=0x70 ... F12=0x7B
VK.update(VK_F)


def press(key: str):
    parts = key.split("+")
    mods = []
    for p in parts[:-1]:
        if p == "Ctrl":
            mods.append(0x11)
        elif p == "Alt":
            mods.append(0x12)
        elif p == "Shift":
            mods.append(0x10)
    base = parts[-1]
    vk = VK.get(base.upper()) if base.upper() in VK else VK.get(base)
    if vk is None:
        return
    for m in mods:
        u.keybd_event(m, 0, 0, 0)
        time.sleep(0.05)
    u.keybd_event(vk, 0, 0, 0)
    time.sleep(0.08)
    u.keybd_event(vk, 0, win32con.KEYEVENTF_KEYUP, 0)
    for m in reversed(mods):
        u.keybd_event(m, 0, win32con.KEYEVENTF_KEYUP, 0)
        time.sleep(0.05)


def snapshot_windows():
    out = {}
    def cb(h, _):
        if win32gui.IsWindowVisible(h):
            t = win32gui.GetWindowText(h)
            if t and t != "tooltips_class32" and win32gui.GetClassName(h) != "tooltips_class32":
                out[h] = t
    win32gui.EnumWindows(cb, None)
    return out


def is_gf_window(title: str, cls: str) -> bool:
    bad = ("CabinetWClass", "Chrome_WidgetWin_1", "Notepad", "CASCADIA_HOSTING", "Windows.UI", "WINDOWSCLIENT", "ConsoleWindowClass")
    if cls in bad:
        return False
    return ("GF" in title) or ("Error" == title.strip()) or cls in ("#32770", "DocAppWindow")


def close_new_windows(before: dict):
    after = snapshot_windows()
    for h, t in after.items():
        if h in before:
            continue
        cls = win32gui.GetClassName(h)
        if not is_gf_window(t, cls):
            continue
        if t.strip() == "Error":
            err = o2.error_text(h)
            o2.close_error()
            return ("error", (err or "")[:160])
        if t.startswith("Online"):
            continue
        try:
            win32gui.SetForegroundWindow(h)
        except Exception:
            pass
        press("ESC")
        time.sleep(0.5)
        if h in snapshot_windows():
            win32gui.PostMessage(h, win32con.WM_CLOSE, 0, 0)
            time.sleep(0.6)
        return ("dialog", f"{t[:80]} [{cls}]")
    return None


def test_window(hwnd, slug, keys=None):
    keys = keys or KEYS
    result = []
    base = snapshot_windows()
    print("== {} (hwnd {}) ==".format(slug, hwnd), flush=True)
    for k in keys:
        if k in SKIP_KEYS:
            result.append({"key": k, "effect": "skipped(label-evidence)"})
            print("  {}: SKIPPED (anti-polusi/label)".format(k), flush=True)
            continue
        # pastikan target foreground (retry)
        for _ in range(3):
            try:
                de.force_focus(hwnd)
            except Exception:
                pass
            time.sleep(0.3)
            if win32gui.GetForegroundWindow() == hwnd:
                break
        time.sleep(0.15)
        before = snapshot_windows()
        press(k)
        time.sleep(0.9)
        eff = close_new_windows(before)
        if eff is None:
            # cek apakah window target masih ada
            if hwnd not in snapshot_windows():
                result.append({"key": k, "effect": "closed-target"})
                print("  {}: CLOSED TARGET".format(k), flush=True)
                break
            result.append({"key": k, "effect": "none"})
            print("  {}: -".format(k), flush=True)
        else:
            kind, info = eff
            result.append({"key": k, "effect": kind, "info": info})
            print("  {}: {} -> {}".format(k, kind, info), flush=True)
            try:
                c.print_window(hwnd).save(os.path.join(SHOTS, f"shortcut-{slug}-{k.replace('+','_')}.png"))
            except Exception:
                pass
    with open(os.path.join(OUT, f"{slug}.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print("  saved:", slug, flush=True)
    return result


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "shell"
    sh = de.shell()
    if not sh:
        print("shell tidak ada", flush=True)
        return
    if which == "shell":
        # Menu Utama (kotak menu) — test hotkey menu (membuka modul -> catat nama window!)
        hot = ["F1", "F2", "F4", "F5", "F7", "F8", "Ctrl+H", "Ctrl+F5", "Ctrl+F7", "Ctrl+P", "Ctrl+F8", "Ctrl+M", "Ctrl+K", "Ctrl+S", "Ctrl+E", "Ctrl+U"]
        if len(sys.argv) > 2:
            hot = sys.argv[2:]
        test_window(sh, "shell" if len(sys.argv) <= 2 else "shell-2", hot)
        de.cleanup_forms()
    elif which == "list":
        h = o2.open_list(24558, "Item")
        if h:
            test_window(h, "list-item")
            for b in de.buttons(h):
                if b["text"].replace("&", "").strip().lower() == "tutup":
                    win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
                    break
    elif which == "form":
        h = o2.open_list(24566, "Pembelian")
        if h:
            r = o2.click_tambah(h)
            form = r[1] if isinstance(r, tuple) else None
            if form:
                test_window(form, "form-pembelian", ["F1", "F3", "F5", "F7", "F8", "F9", "F11", "Ctrl+F7", "Ctrl+F6", "Ctrl+P"])
                for b in de.buttons(form):
                    if b["text"].replace("&", "").strip().lower() == "tutup":
                        win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
                        break
            for b in de.buttons(h):
                if b["text"].replace("&", "").strip().lower() == "tutup":
                    win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
                    break
    elif which == "viewer":
        h = o2.open_list(24642, "Buku Besar")
        if h:
            test_window(h, "viewer-bukubesar", ["F1", "F5", "F7", "F8", "F9", "Ctrl+F7", "Ctrl+F6", "Ctrl+P"])
            for b in de.buttons(h):
                if b["text"].replace("&", "").strip().lower() == "tutup":
                    win32gui.PostMessage(b["hwnd"], 0x00F5, 0, 0)
                    break
    print("DONE", which, flush=True)


if __name__ == "__main__":
    main()
