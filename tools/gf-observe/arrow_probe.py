import sys
import time
import ctypes
import win32gui
import win32api
import win32con

sys.path.insert(0, r"D:\Projects\gf-akuntansi-clone\tools\gf-observe")
import deep_explore as de
import crop_menu_group_icons as c


def main():
    h = next((hh for hh, t in de.all_named_windows().items() if t.startswith("List (Sistem Setup)")), None)
    print("win:", h, flush=True)
    if not h:
        print("tidak ada window list", flush=True)
        return
    l, t, r, b = win32gui.GetWindowRect(h)
    print("rect:", (l, t, r, b), flush=True)
    try:
        win32gui.SetForegroundWindow(h)
    except Exception:
        pass
    time.sleep(0.4)
    # tombol panah kanan (dari kalibrasi gambar: ~x=598/975, y=86/695 dari window)
    for i in range(1, 4):
        win32api.SetCursorPos((l + 604, t + 46))
        time.sleep(0.2)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        time.sleep(0.8)
        try:
            img = c.print_window(h)
            img.save(rf"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\setup-list-arrow{i}.png")
            print(f"shot {i} ok", img.size, flush=True)
        except Exception as e:
            print(f"shot {i} err:", e, flush=True)
            break
    tb = next((b for b in de.buttons(h) if b["text"].replace("&", "").strip().lower() == "tutup"), None)
    if tb:
        win32gui.PostMessage(tb["hwnd"], 0x00F5, 0, 0)
        time.sleep(1)
        print("closed:", h not in de.all_named_windows(), flush=True)


if __name__ == "__main__":
    main()
