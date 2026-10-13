"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Peta hotkey menu GF (hasil V5 audit 13 Okt 2026 — terverifikasi empiris kecuali '*'). */
const NAV: Record<string, string> = {
  F2: "/master/pelanggan",
  F4: "/master/item",
  F5: "/pembelian",
  F7: "/penjualan-eceran",
  F8: "/penjualan",
  "Ctrl+H": "/pembayaran-hutang",
  "Ctrl+F5": "/daftar-hutang",
  "Ctrl+F7": "/sales-order",
  "Ctrl+P": "/penerimaan-piutang",
  "Ctrl+F8": "/daftar-piutang",
  "Ctrl+M": "/kas-masuk",
  "Ctrl+K": "/kas-keluar",
  "Ctrl+S": "/kartu-stock",
  "Ctrl+E": "/kartu-hutang",
  "Ctrl+U": "/kartu-piutang",
};

const KEYLIST: [string, string][] = [
  ["F1", "Show Single Line Edit Set Key list (daftar tombol ini)"],
  ["F2", "Return to First Set Value (kembalikan nilai awal field)"],
  ["F4", "Repeat Last Value (ulangi nilai terakhir field sejenis)"],
  ["F3", "List Semua Item (picker item di form dokumen)"],
  ["F5", "Picker Vendor/Pelanggan (di dalam form) · menu: Pembelian"],
  ["F10 / F12", "Simpan (POS = F10, form dokumen = F12)"],
  ["Ctrl+F7", "Sales Order (dari Menu Utama) · fokus filter Cari (di list)"],
  ["Ctrl+F6", "Fokus filter Tanggal (di list)"],
  ["Esc", "Tutup form/dialog"],
  ["Alt+F10", "Log Off (wajib tutup semua form dulu)"],
  ["Menu:", "F2 Pelanggan · F4 Item · F5 Pembelian · F7 POS · F8 Penjualan"],
  ["Menu:", "Ctrl+H Bayar Hutang · Ctrl+F5 Daftar Hutang · Ctrl+P Penerimaan Piutang"],
  ["Menu:", "Ctrl+F8 Daftar Piutang · Ctrl+M Kas Masuk · Ctrl+K Kas Keluar"],
  ["Menu:", "Ctrl+S Kartu Stock · Ctrl+E Kartu Hutang · Ctrl+U Kartu Piutang"],
];

function combo(e: KeyboardEvent): string {
  let base = e.key;
  if (base === " ") base = "Space";
  if (base.length === 1) base = base.toUpperCase();
  const mods: string[] = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey && base.startsWith("F")) mods.push("Shift");
  return mods.length ? `${mods.join("+")}+${base}` : base;
}

function isField(el: Element | null): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return !!el && ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName);
}

function visible(el: Element): boolean {
  const r = (el as HTMLElement).getBoundingClientRect();
  const st = window.getComputedStyle(el as HTMLElement);
  return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
}

function normTxt(b: Element): string {
  return (b.textContent ?? "").replace(/&/g, "").trim();
}

function clickSimpan(): boolean {
  const btns = Array.from(document.querySelectorAll("button")).filter((b) => visible(b) && normTxt(b).startsWith("Simpan"));
  const b = btns[btns.length - 1];
  if (b) { (b as HTMLButtonElement).click(); return true; }
  return false;
}

function modalRoot(): HTMLElement | null {
  const modals = Array.from(document.querySelectorAll("div.fixed.inset-0")).filter((m) => visible(m)) as HTMLElement[];
  return modals[modals.length - 1] ?? null;
}

function closeTopModal(): boolean {
  const m = modalRoot();
  if (!m) return false;
  const close = Array.from(m.querySelectorAll("button")).find((b) => normTxt(b) === "✕");
  const tutup = Array.from(m.querySelectorAll("button")).filter((b) => normTxt(b).startsWith("Tutup"));
  const target = close ?? tutup[tutup.length - 1];
  if (target) { (target as HTMLButtonElement).click(); return true; }
  return false;
}

function focusFirst(selector: string): boolean {
  const els = Array.from(document.querySelectorAll(selector)).filter((el) => visible(el));
  const el = els[0] as HTMLElement | undefined;
  if (el) { el.focus(); return true; }
  return false;
}

function focusSelectHaving(optionText: string): boolean {
  const sels = Array.from(document.querySelectorAll("select")).filter((s) => visible(s));
  for (const s of sels) {
    if (Array.from((s as HTMLSelectElement).options).some((o) => o.text.includes(optionText))) {
      (s as HTMLSelectElement).focus();
      return true;
    }
  }
  return false;
}

const fieldKey = (el: Element): string => `${el.tagName}|${(el as HTMLInputElement).name || (el as HTMLInputElement).id || (el as HTMLInputElement).getAttribute("title") || "anon"}`;

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showKeys, setShowKeys] = useState(false);
  const [toast, setToast] = useState("");
  const baseVals = useRef(new WeakMap<Element, string>());
  const lastVals = useRef<Record<string, string>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as Element;
      if (isField(el) && !baseVals.current.has(el)) baseVals.current.set(el, (el as HTMLInputElement).value);
    };
    const onFocusOut = (e: FocusEvent) => {
      const el = e.target as Element;
      if (isField(el)) lastVals.current[fieldKey(el)] = (el as HTMLInputElement).value;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return; // halaman (capture handler) menang
      const key = combo(e);
      const inField = isField(document.activeElement);

      if (key === "Escape") { if (closeTopModal()) e.preventDefault(); return; }
      if (key === "F1") { e.preventDefault(); setShowKeys((s) => !s); return; }
      if (inField && key === "F2") {
        const el = document.activeElement as HTMLInputElement;
        const b = baseVals.current.get(el as Element);
        if (b !== undefined) { e.preventDefault(); el.value = b; el.dispatchEvent(new Event("input", { bubbles: true })); }
        return;
      }
      if (inField && key === "F4") {
        const el = document.activeElement as HTMLInputElement;
        const v = lastVals.current[fieldKey(el)];
        if (v !== undefined) { e.preventDefault(); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }
        return;
      }
      if (key === "F10" || key === "F12") { if (clickSimpan()) e.preventDefault(); return; }
      if (key === "F3") { if (focusSelectHaving("--pilih item--") || focusSelectHaving("pilih item")) e.preventDefault(); return; }
      if (key === "F5" && modalRoot()) { if (focusSelectHaving("-- vendor --") || focusSelectHaving("BELUM DIPILIH")) e.preventDefault(); return; }
      if (key === "Ctrl+F7" && pathname !== "/") { if (focusFirst("input[placeholder*='Cari']")) e.preventDefault(); return; }
      if (key === "Ctrl+F6" && pathname !== "/") { if (focusFirst("input[type='date']")) e.preventDefault(); return; }
      if (key === "Alt+F10") {
        e.preventDefault();
        if (modalRoot()) { say("Masih ada window yang masih aktif/buka !"); return; }
        router.push("/");
        say("Log Off — kembali ke Menu Utama.");
        return;
      }
      const dest = NAV[key];
      if (dest) { e.preventDefault(); router.push(dest); return; }
    };
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("keydown", onKey); // bubble: halaman ber-capture menang duluan
    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("keydown", onKey);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname]);

  return (
    <>
      {toast && (
        <div className="fixed bottom-3 right-3 z-[100] gf-3d bg-gf-titlebar px-3 py-[3px] text-[11px]">{toast}</div>
      )}
      {showKeys && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center bg-black/30 p-6" onClick={() => setShowKeys(false)}>
          <div className="w-[720px] border border-gf-border bg-gf-panel shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Key List — GF Akuntansi (1:1)</div>
            <div className="max-h-[420px] overflow-auto p-2">
              <table className="w-full border-collapse text-[11px]">
                <thead><tr className="bg-gf-menubar">
                  <th className="w-[140px] border border-gf-border px-1 py-[1px] text-left font-normal">Key</th>
                  <th className="border border-gf-border px-1 py-[1px] text-left font-normal">Description</th>
                </tr></thead>
                <tbody>
                  {KEYLIST.map(([k, d], i) => (
                    <tr key={i} className={i % 2 ? "bg-[#f4f4f4]" : ""}>
                      <td className="border border-gf-border px-1 py-[1px] font-bold">{k}</td>
                      <td className="border border-gf-border px-1 py-[1px]">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gf-border p-2">
              <button onClick={() => setShowKeys(false)} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">&Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
