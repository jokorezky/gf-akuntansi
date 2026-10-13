"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuan?: string | null; satuanId?: number | null;
  jumlah?: string | null; bonus?: string | null; harga?: string | null;
  discPers?: string | null; discPers2?: string | null; discPers3?: string | null; discNilai?: string | null;
  nilai?: string | null; toexRec?: boolean | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; tglKirim?: string | null; tglTutup?: string | null;
  pelangId?: number | null; pelangNama?: string | null; po?: string | null; salesId?: number | null;
  jenpemId?: number | null; mauang?: number | null; totHarga?: string | null; totDisc?: string | null;
  discNilai?: string | null; ppnTipe?: number | null; ppnPers?: string | null; ppnNilai?: string | null;
  penjuaId?: number | null; penjuaNo?: string | null; catatan?: string | null; lines?: Line[];
};

const LF = `stockId stockNama satuan satuanId jumlah bonus harga discPers discPers2 discPers3 discNilai nilai toexRec catatan`;
const HF = `id no tanggal tglKirim tglTutup pelangId pelangNama po salesId jenpemId mauang totHarga totDisc discNilai ppnTipe ppnPers ppnNilai penjuaId penjuaNo catatan`;
const LIST = `query($q:String){ salesOrderList(q:$q){ total rows { ${HF} } } }`;
const REFS = `{ pelangganRefList { id nama } itemList(limit:40){ rows { id nama } } jenpenRefList { id nama } }`;
const BYID = `query($id:Int!){ salesOrderById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:SalesOrderInput!){ createSalesOrder(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:SalesOrderInput!){ updateSalesOrder(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteSalesOrder(id:$id) }`;
const ICON = "/gf-icons/screens/pembelian";

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
function lineNilai(l: Line): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", bonus: "0", harga: "0", discPers: "0", discPers2: "0", discPers3: "0", discNilai: "0", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), tglKirim: "", tglTutup: "",
  pelangId: null, po: "", salesId: null, jenpemId: null, mauang: 1, discNilai: "0", ppnTipe: 0, ppnPers: "0.00",
  catatan: "", lines: [emptyLine()],
});

export default function SalesOrderPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [pelanggan, setPelanggan] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [jenpen, setJenpen] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ salesOrderList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.salesOrderList.rows);
    setTotal(d.salesOrderList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ pelangganRefList: Ref[]; itemList: { rows: Ref[] }; jenpenRefList: Ref[] }>(REFS)
      .then((d) => { setPelanggan(d.pelangganRefList); setItems(d.itemList.rows); setJenpen(d.jenpenRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    let gross = 0, disc = 0;
    for (const l of lines) { const g = num(l.jumlah) * num(l.harga); gross += g; disc += g - lineNilai(l); }
    const totHarga = Math.round(gross * 100) / 100;
    const totDisc = Math.round((disc + num(form?.discNilai)) * 100) / 100;
    const totalB = Math.round((totHarga - totDisc) * 100) / 100;
    const ppn = num(form?.ppnPers) > 0 ? Math.round(totalB * num(form?.ppnPers)) / 100 : 0;
    return { totHarga: r2(totHarga), totDisc: r2(totDisc), total: r2(totalB), ppn: r2(ppn) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ salesOrderById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm(d.salesOrderById); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus sales order id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, pelangNama: _pn, totHarga: _th, totDisc: _td, ppnNilai: _pn2, penjuaId: _p1, penjuaNo: _p2, ...rest } = form;
      const input = { ...rest, lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, jumlah: l.jumlah, bonus: l.bonus, harga: l.harga, satuan: l.satuanId, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, discNilai: l.discNilai, catatan: l.catatan })) };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  async function copyItem() {
    const l = (form?.lines ?? [])[lsel];
    if (!l) return setMsg("Pilih baris dulu.");
    const txt = JSON.stringify({ stockId: l.stockId, stockNama: l.stockNama, jumlah: l.jumlah, bonus: l.bonus, harga: l.harga, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, discNilai: l.discNilai });
    try { await navigator.clipboard.writeText(txt); } catch { /* offline fallback */ }
    (window as unknown as { __soClip?: string }).__soClip = txt;
    setMsg("Item di-copy ke clipboard.");
  }
  async function pasteItem() {
    let txt = (window as unknown as { __soClip?: string }).__soClip ?? "";
    if (!txt) {
      try { txt = await navigator.clipboard.readText(); } catch { txt = ""; }
    }
    if (!txt) return setMsg("Clipboard kosong.");
    try {
      const l = JSON.parse(txt) as Line;
      set({ lines: [...(form?.lines ?? []), { ...emptyLine(), ...l }], id: form?.id ?? 0 });
      setMsg("Item di-paste dari clipboard.");
    } catch { setMsg("Isi clipboard bukan item S/O."); }
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Sales Order</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="Z..A" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E N J U A L A N&nbsp;&nbsp;-&nbsp;&nbsp;S A L E S&nbsp;&nbsp;O R D E R</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>(-Semua Divisi-)</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/laporan.png`} alt="Laporan" width={54} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Rincian Per Item — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/rincian.png`} alt="Rincian" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Tutup SO — buka form lalu isi Tgl Tutup")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup-po.png`} alt="Tutup SO" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak-setup.png`} alt="Cetak Setup" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} unoptimized /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / pelanggan..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} unoptimized /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} unoptimized /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} unoptimized /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[330px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Web", "No", "PO", "Tanggal", "Pukul", "Kirim", "Tutup", "Pelanggan", "MU", "Harga", "Discount", "PJK/PPN", "%PJK", "Total", "Divisi", "Jenis Penj"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td} />
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.po}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td} />
                    <td className={td}>{r.tglKirim}</td>
                    <td className={td}>{r.tglTutup}</td>
                    <td className={td}>{r.pelangNama}</td>
                    <td className={td}>IDR</td>
                    <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                    <td className={`${td} text-right font-mono`}>{r.totDisc}</td>
                    <td className={td}>{r.ppnTipe ? "PJK" : "-"}</td>
                    <td className={`${td} text-right`}>{r.ppnPers}</td>
                    <td className={`${td} text-right font-mono`}>{r2(num(r.totHarga) - num(r.totDisc))}</td>
                    <td className={td} />
                    <td className={td}>{jenpen.find((d) => d.id === r.jenpemId)?.nama ?? ""}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={17} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_360px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={sel ?? ""} />
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Semua Data</label>
              <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>Tgl Kirim :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>No :</span><input className="gf-3d bg-white px-2 py-[1px]" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>P/O :</span><input className="gf-3d bg-white px-2 py-[1px]" placeholder="cari P/O..." onChange={(e) => setQ(e.target.value)} />
              <span>Pelanggan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.pelangNama ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.catatan ?? ""} />
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <div className="mb-1 flex flex-col gap-1">
                <select className="gf-3d bg-white px-1 py-[2px]"><option>--</option></select>
                <select className="gf-3d bg-white px-1 py-[2px]"><option>--</option></select>
                <select className="gf-3d bg-white px-1 py-[2px]"><option>--</option></select>
              </div>
              <div className="flex gap-1">
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-green-700">Ctrl+F7</button>
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-gf-muted">Ctrl+F6</button>
              </div>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total} · Realisasi: {rows.find((x) => x.id === sel)?.penjuaNo ? `Penjualan ${rows.find((x) => x.id === sel)?.penjuaNo}` : "belum terealisasi"}</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[1160px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Sales Order {mode === "edit" ? `#${form.id}` : "[Baru]"}{form.penjuaNo ? ` — realisasi: Penjualan ${form.penjuaNo}` : ""}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[80px_1fr_70px_230px] gap-x-2 gap-y-1 text-[12px]">
                <span>Pelanggan :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.pelangId ?? ""} onChange={(e) => set({ pelangId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">*** BELUM DIPILIH ***</option>{pelanggan.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
                <span className="text-right">No :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value })} />
                <span>Sales :</span>
                <div className="flex items-center gap-1">
                  <select className="gf-3d w-[160px] bg-white px-1 py-[2px]" value={form.salesId ?? ""} onChange={(e) => set({ salesId: e.target.value ? Number(e.target.value) : null })}><option value="">--pilih sales--</option></select>
                </div>
                <span className="text-right">No P/O :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={form.po ?? ""} onChange={(e) => set({ po: e.target.value })} />
                <span />
                <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                  <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-1 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} />
                </div>
                <span className="text-right">Kirim :</span>
                <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={form.tglKirim ?? ""} onChange={(e) => set({ tglKirim: e.target.value })} />
                <span>M.U. :</span>
                <div className="flex items-center gap-1">
                  <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}><option value={1}>IDR</option></select>
                  <span className="text-[11px]">Jenis Penj :</span>
                  <select className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={form.jenpemId ?? ""} onChange={(e) => set({ jenpemId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{jenpen.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </div>
                <span />
                <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                  <span>Tutup :</span><input type="date" className="gf-3d bg-white px-1 py-[2px]" value={form.tglTutup ?? ""} onChange={(e) => set({ tglTutup: e.target.value })} />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1">
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()], id: form.id })} className="gf-3d flex items-center gap-1 bg-gf-menubar px-3 py-[2px] text-[11px]">
                  <Image src={`${ICON}/tambah.png`} alt="" width={26} height={22} unoptimized /> Tambah
                </button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d flex items-center gap-1 bg-gf-menubar px-3 py-[2px] text-[11px]">
                  <Image src={`${ICON}/koreksi.png`} alt="" width={26} height={22} unoptimized /> Koreksi
                </button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel), id: form.id })} className="gf-3d flex items-center gap-1 bg-gf-menubar px-3 py-[2px] text-[11px]">
                  <Image src={`${ICON}/hapus.png`} alt="" width={26} height={22} unoptimized /> Hapus
                </button>
                <button onClick={copyItem} className="gf-3d flex items-center gap-1 bg-gf-menubar px-3 py-[2px] text-[11px]">
                  <span className="inline-block h-[14px] w-[14px] bg-[#c8c8c8]" /> Copy Item ke Clipboard
                </button>
                <button onClick={pasteItem} className="gf-3d flex items-center gap-1 bg-gf-menubar px-3 py-[2px] text-[11px]">
                  <span className="inline-block h-[14px] w-[14px] bg-[#c8c8c8]" /> Paste Item dari Clipboard
                </button>
              </div>

              <div className="mt-1 max-h-[240px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-gf-menubar">
                    {["", "Kode", "Nama", "Jumlah", "Bonus", "@", "Harga Jual", "Disc%", "Disc%2", "Disc%3", "Nilai", "Real"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>{i + 1}</td>
                        <td className={`${td} w-[80px]`}><input className={`${tin} w-[80px]`} value={l.stockId || ""} onChange={(e) => setLine(i, { stockId: Number(e.target.value) || 0 })} /></td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[54px]`} value={l.jumlah ?? ""} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[50px]`} value={l.bonus ?? "0"} onChange={(e) => setLine(i, { bonus: e.target.value })} /></td>
                        <td className={td}>x</td>
                        <td className={td}><input className={`${tin} w-[84px] font-mono`} value={l.harga ?? ""} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[42px]`} value={l.discPers ?? "0"} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[42px]`} value={l.discPers2 ?? "0"} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[42px]`} value={l.discPers3 ?? "0"} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                        <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                        <td className={`${td} text-center`}>{l.toexRec ? "✔" : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 grid grid-cols-[480px_1fr] gap-2">
                <div className="grid grid-cols-[70px_1fr_60px_1fr] items-center gap-x-2 gap-y-[3px] text-[12px]">
                  <span>Discount :</span>
                  <div className="flex items-center gap-1">
                    <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={form.discNilai ?? "0"} onChange={(e) => set({ discNilai: e.target.value })} />
                    <span className="text-[11px]">0.00%</span>
                  </div>
                  <span>PJK :</span>
                  <div className="flex items-center gap-1">
                    <select className="gf-3d w-[60px] bg-white px-1 py-[2px] text-[11px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                    <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right" value={form.ppnPers ?? "0.00"} onChange={(e) => set({ ppnPers: e.target.value })} />
                    <span className="text-[11px]">0.00%</span><span className="text-[11px]">0.00%</span>
                  </div>
                  <span>Catatan :</span>
                  <textarea className="gf-3d col-span-3 h-[64px] bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
                </div>
                <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[12px]">
                  <div className="flex justify-between"><span>Total Harga :</span><b className="font-mono">{totals.totHarga}</b></div>
                  <div className="flex justify-between"><span>Total Disc :</span><b className="font-mono">{totals.totDisc}</b></div>
                  <div className="flex justify-between"><span>PPN :</span><b className="font-mono">{form.ppnTipe ? totals.ppn : "0.00"}</b></div>
                  <div className="flex justify-between"><span>Realisasi :</span><b className="font-mono">{form.penjuaNo ? `Penjualan ${form.penjuaNo}` : "-"}</b></div>
                  <div className="mt-1 flex justify-between border-t border-gf-border pt-1 font-bold text-red-700"><span>T O T A L :</span><b className="font-mono">{totals.total}</b></div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={onSimpan} className="gf-3d ml-auto w-[280px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
              <div className="mt-1 text-[11px] text-gf-muted">{form.pelangId ? "" : "Pelanggan belum dipilih!"} · Volume : - M³ · - Ltr</div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
