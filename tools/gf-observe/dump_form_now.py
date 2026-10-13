import sys, os, time, ctypes, json
sys.path.insert(0, r"D:\Projects\gf-akuntansi-explorer\src")
import win32gui, gf, pyautogui

gf.set_dpi_aware()
root = gf.find_shell()["hwnd"]
CTRL = {"Static","Edit","Button","ComboBox","ListBox","SysListView32","ListView","SysTreeView32","SysTabControl32","msctls_statusbar32","msctls_updown32","Button"}

# find the modal entry form: top-level or child, class #32770/WndAppWindow, title 'Karyawan', big area around x546..1385
cands = []
def scan(h, _=None):
    if h in cands:
        return
    if win32gui.IsWindowVisible(h):
        c = win32gui.GetClassName(h)
        t = win32gui.GetWindowText(h)
        r = win32gui.GetWindowRect(h)
        if c in ("#32770","WndAppWindow","DocAppWindow") and t.strip()=="Karyawan":
            cands.append((h,c,t,r))
win32gui.EnumWindows(scan, None)
win32gui.EnumChildWindows(root, scan, None)
print("cands:", [(c,t,r) for _,c,t,r in cands])
# pick the one with left>50 (modal is offset, list is at ~3)
form = None
for h,c,t,r in cands:
    if r[0] > 50 and (r[2]-r[0]) < 1000:
        form = (h,c,t,r)
if not form and cands:
    form = cands[-1]
print("form:", form)
if form:
    h,c,t,r = form
    im = pyautogui.screenshot()
    im.crop(r).save(r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\karyawan-form.png")
    ctrls=[]
    seen=set()
    def cb(x,_):
        if x in seen: return
        seen.add(x)
        if win32gui.IsWindowVisible(x) and win32gui.GetClassName(x) in CTRL:
            ctrls.append({"class":win32gui.GetClassName(x),"text":win32gui.GetWindowText(x),"rect":list(win32gui.GetWindowRect(x))})
    win32gui.EnumChildWindows(h, cb, None)
    json.dump({"slug":"karyawan-form","window_class":c,"title":t,"rect":list(r),"controls":ctrls}, open(r"D:\Projects\gf-akuntansi-clone\tools\gf-observe\screens\karyawan-form.json","w",encoding="utf-8"), indent=2, ensure_ascii=False)
    print("controls:", len(ctrls))
    for ct in ctrls:
        print("  ", ct["class"], repr(ct["text"]), ct["rect"])
    # close the modal (Tutup) then list
    win32gui.PostMessage(h, 0x0010, 0, 0)
    time.sleep(0.6)
# close any remaining Karyawan list window and go home
for h,c,t,r in list(cands):
    try: win32gui.PostMessage(h, 0x0010, 0, 0)
    except Exception: pass
time.sleep(0.5)
ctypes.windll.user32.SendMessageW(root, 0x0111, 24514, 0)
print("done")
