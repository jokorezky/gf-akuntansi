import sys, os, time, ctypes, json
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, gf, pyautogui

gf.set_dpi_aware(); ctypes.windll.shcore.SetProcessDpiAwareness(2)
OUT = r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens"
CTRL = {"Static","Edit","Button","ComboBox","ListBox","SysListView32","ListView","SysTreeView32","SysTabControl32","msctls_statusbar32","msctls_updown32"}

forms = []
def cb(h, _):
    if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "#32770":
        t = win32gui.GetWindowText(h); r = win32gui.GetWindowRect(h)
        if r[2]-r[0] > 300:
            forms.append((h, t, r))
win32gui.EnumWindows(cb, None)
print("forms:", forms)
if not forms:
    sys.exit("no modal open")
h, t, r = forms[0]
pyautogui.screenshot().crop(r).save(os.path.join(OUT, "karyawan-form.png"))
ctrls, seen = [], set()
def c2(x, _):
    if x in seen: return
    seen.add(x)
    if win32gui.IsWindowVisible(x) and win32gui.GetClassName(x) in CTRL:
        ctrls.append({"class": win32gui.GetClassName(x), "text": win32gui.GetWindowText(x), "rect": list(win32gui.GetWindowRect(x))})
win32gui.EnumChildWindows(h, c2, None)
json.dump({"slug":"karyawan-form","window_class":"#32770","title":t,"rect":list(r),"controls":ctrls},
          open(os.path.join(OUT,"karyawan-form.json"),"w",encoding="utf-8"), indent=2, ensure_ascii=False)
print("controls:", len(ctrls))
for c in ctrls:
    print("  ", c["class"], repr(c["text"]), c["rect"])
win32gui.PostMessage(h, 0x0010, 0, 0); time.sleep(0.6)
root = gf.find_shell()["hwnd"]
for _, (cc, tt, rr) in {0:(0,0,0)}.items(): pass
# close list + home
def cl(hh, _):
    if win32gui.IsWindowVisible(hh) and win32gui.GetClassName(hh) in ("DocAppWindow","WndAppWindow") and win32gui.GetWindowText(hh).strip()=="Karyawan":
        win32gui.PostMessage(hh,0x0010,0,0)
win32gui.EnumChildWindows(root, cl, None)
time.sleep(0.5)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24514, 0)
print("closed, home")
