"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuan?: string | null; satuanId?: number | null;
  jumlah?: string | null; harga?: string | null;
  discPers?: string | null; discPers2?: string | null; discPers3?: string | null; discNilai?: string | null;
  nilai?: string | null; expired?: string | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; tanggal2?: string | null;
  vendorId?: number | null; vendorNama?: string | null; gudang?: number | null; purcorId?: number | null;
  noFakpjk?: string | null; tglFakpjk?: string | null; mauang?: number | null; kurs?: string | null;
  totHarga?: string | null; totDisc?: string | null; discNilai?: string | null; totRetur?: string | null;
  adj01?: string | null; adj02?: string | null; adj03?: string | null; adj04?: string | null; adj05?: string | null;
  ppnTipe?: number | null; ppnPers?: string | null; ppnNilai?: string | null; deposit?: string | null;
  termCrd?: number | null; catatan?: string | null; lines?: Line[];
};

const LF = `stockId stockNama satuan satuanId jumlah harga discPers discPers2 discPers3 discNilai nilai expired catatan`;
const HF = `id no tanggal tanggal2 vendorId vendorNama gudang purcorId noFakpjk tglFakpjk mauang kurs totHarga totDisc discNilai totRetur adj01 adj02 adj03 adj04 adj05 ppnTipe ppnPers ppnNilai deposit termCrd catatan`;
const LIST = `query($q:String){ purchaseList(q:$q){ total rows { ${HF} } } }`;
const REFS = `{ vendorRefList { id nama } itemList(limit:40){ rows { id nama } } }`;
const BYID = `query($id:Int!){ purchaseById(id:$id){ ${HF} lines { ${LF} } } }`;
const PO_LIST = `{ purchaseOrderList(limit:40){ rows { id no vendorNama tanggal } } }`;
const PO_BYID = `query($id:Int!){ purchaseOrderById(id:$id){ id vendorId lines { stockId stockNama jumlah harga discPers discPers2 discPers3 discNilai } } }`;
const CREATE = `mutation($input:PurchaseInput!){ createPurchase(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PurchaseInput!){ updatePurchase(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePurchase(id:$id) }`;
const ICON = "/gf-icons/screens/pembelian";

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
function lineNilai(l: Line): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", harga: "0", discPers: "0", discPers2: "0", discPers3: "0", discNilai: "0", expired: "", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), tanggal2: "", vendorId: null, gudang: 1,
  noFakpjk: "", tglFakpjk: "", mauang: 1, kurs: "1.0000", discNilai: "0", ppnTipe: 0, ppnPers: "0.00",
  adj01: "0", adj02: "0", adj03: "0", adj04: "0", adj05: "0", deposit: "0", termCrd: 0, catatan: "", lines: [emptyLine()],
});

export default function PembelianPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [belum, setBelum] = useState(true);
  const [sudah, setSudah] = useState(true);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [pickItem, setPickItem] = useState(false);
  const [pickPo, setPickPo] = useState(false);
  const [poRows, setPoRows] = useState<{ id: number; no?: number | null; vendorNama?: string | null; tanggal?: string | null }[]>([]);
  const [updHarga, setUpdHarga] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ purchaseList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.purchaseList.rows);
    setTotal(d.purchaseList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[]; itemList: { rows: Ref[] } }>(REFS)
      .then((d) => { setVendors(d.vendorRefList); setItems(d.itemList.rows); })
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
    const totRetur = num(form?.totRetur);
    const adj = num(form?.adj01) + num(form?.adj02) + num(form?.adj03) + num(form?.adj04) + num(form?.adj05);
    const totalB = Math.round((totHarga - totDisc - totRetur + adj) * 100) / 100;
    const ppn = num(form?.ppnPers) > 0 ? Math.round(totalB * num(form?.ppnPers)) / 100 : 0;
    return { totHarga: r2(totHarga), totDisc: r2(totDisc), totRetur: r2(totRetur), adj: r2(adj), total: r2(totalB), ppn: r2(ppn) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ purchaseById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm(d.purchaseById); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus pembelian id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, vendorNama: _vn, totHarga: _th, totDisc: _td, totRetur: _tr, ppnNilai: _pn, ...rest } = form;
      const input = { ...rest, lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, jumlah: l.jumlah, harga: l.harga, satuan: l.satuanId, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, discNilai: l.discNilai, expired: l.expired || null, catatan: l.catatan })) };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(updHarga ? "Tersimpan. (Update Harga Beli Master: menyusul otomatis)" : "Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  async function openPickPo() {
    const d = await gql<{ purchaseOrderList: { rows: typeof poRows } }>(PO_LIST);
    setPoRows(d.purchaseOrderList.rows); setPickPo(true);
  }
  async function applyPo(poId: number) {
    const d = await gql<{ purchaseOrderById: { vendorId?: number | null; lines?: Line[] } }>(PO_BYID, { id: poId });
    set({ purcorId: poId, vendorId: d.purchaseOrderById.vendorId ?? null, lines: (d.purchaseOrderById.lines ?? []).map((l) => ({ ...emptyLine(), stockId: l.stockId, stockNama: l.stockNama, jumlah: l.jumlah, harga: l.harga, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, discNilai: l.discNilai })) });
    setPickPo(false); setMsg("Baris diambil dari PO.");
  }

  const td = "border border-gf-border px-2 py-[2px]";
  const tin = "w-full bg-transparent text-right";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Pembelian</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="Z..A" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E M B E L I A N&nbsp;&nbsp;-&nbsp;&nbsp;P E M B E L I A N</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>(-Semua Divisi-)</option></select>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/laporan.png`} alt="Laporan" width={58} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Rincian Per Item — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/rincian.png`} alt="Rincian" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak-setup.png`} alt="Cetak Setup" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} unoptimized /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / vendor..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} unoptimized /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} unoptimized /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} unoptimized /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[340px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Gudang", "MU", "No", "Tanggal", "Tanggal (2)", "Vendor", "PO", "Kurs", "Harga Beli", "Discount", "PJK/PPN", "%PJK", "Total", "Deposit", "Credit"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.gudang}</td>
                    <td className={td}>IDR</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.tanggal2}</td>
                    <td className={td}>{r.vendorNama}</td>
                    <td className={td}>{r.purcorId}</td>
                    <td className={`${td} text-right`}>{r.kurs}</td>
                    <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                    <td className={`${td} text-right font-mono`}>{r.totDisc}</td>
                    <td className={td}>{r.ppnTipe ? "PJK" : "-"}</td>
                    <td className={`${td} text-right`}>{r.ppnPers}</td>
                    <td className={`${td} text-right font-mono`}>{r2(num(r.totHarga) - num(r.totDisc) - num(r.totRetur) + num(r.adj01) + num(r.adj02) + num(r.adj03) + num(r.adj04) + num(r.adj05))}</td>
                    <td className={`${td} text-right font-mono`}>{r.deposit}</td>
                    <td className={td}>{r.termCrd} hari</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={16} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_320px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={sel ?? ""} />
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Semua Data</label>
              <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>No :</span><input className="gf-3d bg-white px-2 py-[1px]" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>PO :</span><input className="gf-3d bg-white px-2 py-[1px]" placeholder="cari PO..." onChange={(e) => setQ(e.target.value)} />
              <span>Vendor :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.vendorNama ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.catatan ?? ""} />
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={belum} onChange={(e) => setBelum(e.target.checked)} /> Yang Belum Ada Pelunasan</label>
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={sudah} onChange={(e) => setSudah(e.target.checked)} /> Yang Sudah Ada Pelunasan</label>
              <div className="mt-1 flex gap-1">
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-green-700">Ctrl+F7</button>
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-gf-muted">Ctrl+F6</button>
              </div>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[1160px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Pembelian {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[80px_1fr_80px_230px] gap-x-2 gap-y-1 text-[12px]">
                <span>Vendor :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">*** BELUM DIPILIH ***</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
                <span className="text-right">Gudang :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang ?? 1} onChange={(e) => set({ gudang: Number(e.target.value) })}>
                  <option value={1}>GUDANG MASTER</option>
                </select>
                <button onClick={() => setMsg("Fak Pjk — isi No Faktur Pajak di samping")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Fak Pjk</button>
                <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                  <span>No :</span><input className="gf-3d bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value })} />
                </div>
                <span className="text-right">P/O :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.purcorId ?? ""} onChange={(e) => set({ purcorId: e.target.value ? Number(e.target.value) : null })} />
                <span />
                <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                  <span>Tanggal :</span>
                  <div className="flex gap-1">
                    <input type="date" className="gf-3d w-full bg-white px-1 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} />
                    <input type="date" className="gf-3d w-full bg-white px-1 py-[2px]" value={form.tanggal2 ?? ""} onChange={(e) => set({ tanggal2: e.target.value })} />
                  </div>
                </div>
                <span className="text-right">MU/Kurs :</span>
                <div className="flex items-center gap-1">
                  <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}><option value={1}>IDR</option></select>
                  <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right" value={form.kurs ?? "1.0000"} onChange={(e) => set({ kurs: e.target.value })} />
                </div>
                <span>No Faktur Pajak:</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={form.noFakpjk ?? ""} onChange={(e) => set({ noFakpjk: e.target.value })} />
                <span>Tgl Faktur :</span>
                <input type="date" className="gf-3d bg-white px-1 py-[2px]" value={form.tglFakpjk ?? ""} onChange={(e) => set({ tglFakpjk: e.target.value })} />
              </div>

              <div className="mt-2 flex gap-1">
                <button onClick={openPickPo} className="gf-3d flex items-center gap-1 bg-gf-menubar px-2 py-[2px] text-[11px]">
                  <span className="inline-block h-[12px] w-[12px] border border-gf-border bg-white" /> Tambah Dari PO
                </button>
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()], id: form.id })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel), id: form.id })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
              </div>

              <div className="mt-1 max-h-[260px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-gf-menubar">
                    {["Gudang", "Kode", "Nama", "Jumlah", "Retur", "@", "Harga Beli", "Disc%", "Disc%2", "Disc%3", "Nilai", "Expired", "Catatan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>1</td>
                        <td className={`${td} w-[80px]`}><input className={`${tin} w-[80px]`} value={l.stockId || ""} onChange={(e) => setLine(i, { stockId: Number(e.target.value) || 0 })} /></td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[60px]`} value={l.jumlah ?? ""} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={td}>0</td>
                        <td className={td}>x</td>
                        <td className={td}><input className={`${tin} w-[90px] font-mono`} value={l.harga ?? ""} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[44px]`} value={l.discPers ?? "0"} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[44px]`} value={l.discPers2 ?? "0"} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[44px]`} value={l.discPers3 ?? "0"} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                        <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                        <td className={td}><input type="date" className="w-[110px] bg-transparent" value={l.expired ?? ""} onChange={(e) => setLine(i, { expired: e.target.value })} /></td>
                        <td className={td}><input className="w-[110px] bg-transparent" value={l.catatan ?? ""} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 grid grid-cols-[480px_1fr] gap-2">
                <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] text-[12px]">
                  <span>Discount :</span>
                  <div className="flex items-center gap-1">
                    <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={form.discNilai ?? "0"} onChange={(e) => set({ discNilai: e.target.value })} />
                    <span className="text-[11px]">0.00%</span>
                  </div>
                  <span>PJK :</span>
                  <div className="flex items-center gap-1">
                    <select className="gf-3d w-[60px] bg-white px-1 py-[2px] text-[11px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                    <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right" value={form.ppnPers ?? "0.00"} onChange={(e) => set({ ppnPers: e.target.value })} />
                  </div>
                  <span>Credit :</span>
                  <div className="flex items-center gap-1">
                    <input className="gf-3d w-[60px] bg-white px-2 py-[2px] text-right" value={form.termCrd ?? 0} onChange={(e) => set({ termCrd: Number(e.target.value) })} />
                    <span className="text-[11px]">hari</span>
                    <span className="gf-3d flex-1 bg-[#c8f0c8] px-2 py-[2px] text-[11px]">Hari ini</span>
                  </div>
                  <span>Deposit :</span>
                  <input className="gf-3d w-[130px] bg-white px-2 py-[2px] text-right font-mono" value={form.deposit ?? "0"} onChange={(e) => set({ deposit: e.target.value })} />
                  <span>Catatan :</span>
                  <input className="gf-3d bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
                </div>
                <div className="border border-gf-border bg-[#c8c8f0] p-2 text-[12px]">
                  <div className="flex justify-between"><span>Adjustment :</span><input className="w-[90px] bg-white px-1 text-right" value={form.adj01 ?? "0"} onChange={(e) => set({ adj01: e.target.value })} /></div>
                  <div className="flex justify-between"><span>Total Harga :</span><b className="font-mono">{totals.totHarga}</b></div>
                  <div className="flex justify-between"><span>Total Disc :</span><b className="font-mono">{totals.totDisc}</b></div>
                  <div className="flex justify-between"><span>Total Retur :</span><b className="font-mono">{totals.totRetur}</b></div>
                  <div className="flex justify-between"><span>Adjustment :</span><b className="font-mono">{totals.adj}</b></div>
                  <div className="mt-1 flex justify-between border-t border-gf-border pt-1 font-bold"><span>T O T A L :</span><b className="font-mono">{totals.total}</b></div>
                  <div className="flex justify-between"><span>PPN :</span><b className="font-mono">{form.ppnTipe ? totals.ppn : "0.00"}</b></div>
                  <div className="flex justify-between"><span>Deposit :</span><b className="font-mono">{num(form.deposit).toFixed(2)}</b></div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <span className="px-3 tracking-[4px]">C R E D I T</span>
                <label className="flex items-center gap-1 text-[11px]">
                  <input type="checkbox" checked={updHarga} onChange={(e) => setUpdHarga(e.target.checked)} /> Update Harga Beli Master File - Item
                </label>
                <button onClick={onSimpan} className="gf-3d ml-auto w-[220px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[220px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
              <div className="mt-1 text-[11px] text-gf-muted">No belum diisi!  ·  Volume : - M³ · - Ltr</div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
            </div>
          </div>
        </div>
      )}

      {pickItem && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setPickItem(false)}>
          <div className="w-[420px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[13px] font-bold">Tambah Item</div>
            <div className="max-h-[300px] overflow-auto border border-gf-border bg-white">
              {items.map((x) => (
                <button key={x.id} className="block w-full px-2 py-[2px] text-left text-[12px] hover:bg-[#e8eef7]" onClick={() => { set({ lines: [...(form.lines ?? []), { ...emptyLine(), stockId: x.id, stockNama: x.nama }], id: form.id }); setPickItem(false); }}>
                  {x.id} — {x.nama}
                </button>
              ))}
            </div>
            <div className="mt-2 text-right"><button onClick={() => setPickItem(false)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]">Tutup</button></div>
          </div>
        </div>
      )}

      {pickPo && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setPickPo(false)}>
          <div className="w-[520px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[13px] font-bold">Tambah Dari PO</div>
            <div className="max-h-[300px] overflow-auto border border-gf-border bg-white">
              {poRows.map((p) => (
                <button key={p.id} className="block w-full px-2 py-[2px] text-left text-[12px] hover:bg-[#e8eef7]" onClick={() => applyPo(p.id)}>
                  #{p.id} · PO {p.no ?? "-"} · {p.vendorNama ?? "-"} · {p.tanggal ?? ""}
                </button>
              ))}
              {poRows.length === 0 && <div className="px-2 py-2 text-[12px] text-gf-muted">Tidak ada PO.</div>}
            </div>
            <div className="mt-2 text-right"><button onClick={() => setPickPo(false)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
