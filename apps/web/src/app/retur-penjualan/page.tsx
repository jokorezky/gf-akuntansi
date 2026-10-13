"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuan?: number | null; satuanC?: string | null; satRusak?: number | null;
  jumlah?: string | null; jmlRusak?: string | null; bonSatuan?: number | null; bonJumlah?: string | null;
  harga?: string | null; discPers?: string | null; discPers2?: string | null; discPers3?: string | null; discNilai?: string | null;
  hpp?: string | null; hppRusak?: string | null; dariMast?: boolean | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; tglPajak?: string | null;
  pelangId?: number | null; pelangNama?: string | null; pelAlamat?: string | null; salesId?: number | null;
  gudang?: number | null; divisiId?: number | null; jenpenId?: number | null; cash?: boolean | null;
  mauang?: number | null; kurs?: string | null; kursPajak?: string | null;
  penjuaId?: number | null; penjuaNo?: string | null; penjuaId2?: number | null; penjuaNo2?: string | null;
  discNilai?: string | null; discPerst?: string | null; ppnTipe?: number | null; ppnPers?: string | null; ppnNilai?: string | null;
  adj1?: string | null; adj2?: string | null; adj3?: string | null; adj4?: string | null; adj5?: string | null;
  termCrd?: number | null; catatan?: string | null; catatan2?: string | null; catatan3?: string | null; alsBatal?: string | null;
  totHarga?: string | null; totDisc?: string | null; totalNilai?: string | null; totalRetur?: string | null; lines?: Line[];
};

const LF = `stockId stockNama satuan satuanC satRusak jumlah jmlRusak bonSatuan bonJumlah harga discPers discPers2 discPers3 discNilai hpp hppRusak dariMast catatan`;
const HF = `id no tanggal tglPajak pelangId pelangNama pelAlamat salesId gudang divisiId jenpenId cash mauang kurs kursPajak penjuaId penjuaNo penjuaId2 penjuaNo2 discNilai discPerst ppnTipe ppnPers ppnNilai adj1 adj2 adj3 adj4 adj5 termCrd catatan catatan2 catatan3 alsBatal totHarga totDisc totalNilai totalRetur`;
const LIST = `query($q:String){ returPenjualanList(q:$q){ total rows { id gudang no tanggal pelangNama kurs mauang totHarga totDisc ppnTipe ppnPers totalNilai totalRetur penjuaNo penjuaNo2 } } }`;
const BYID = `query($id:Int!){ returPenjualanById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:ReturPenjualanInput!){ createReturPenjualan(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:ReturPenjualanInput!){ updateReturPenjualan(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteReturPenjualan(id:$id) }`;
const REFS = `{ pelangganRefList { id nama } itemList(limit:500) { rows { id nama } } saleList(limit:300) { rows { id no totHarga } } }`;
const ICON = "/gf-icons/screens/pembelian";

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
function lineNilai(l: Line): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", jmlRusak: "0", bonJumlah: "0", harga: "0", discPers: "0", discPers2: "0", discPers3: "0", discNilai: "0", hpp: "0", hppRusak: "0", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), pelangId: null, gudang: 1, mauang: 1,
  kurs: "1", kursPajak: "1", discNilai: "0", discPerst: "0", ppnTipe: 0, ppnPers: "0",
  adj1: "0", adj2: "0", adj3: "0", adj4: "0", adj5: "0", catatan: "", lines: [],
});

export default function ReturPenjualanPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [pel, setPel] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [inv, setInv] = useState<{ id: number; no?: string | null; totHarga?: string | null }[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ returPenjualanList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.returPenjualanList.rows); setTotal(d.returPenjualanList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ pelangganRefList: Ref[]; itemList: { rows: Ref[] }; saleList: { rows: { id: number; no?: string | null; totHarga?: string | null }[] } }>(REFS)
      .then((d) => { setPel(d.pelangganRefList); setItems(d.itemList.rows); setInv(d.saleList.rows); }).catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    let sub = 0, gross = 0;
    for (const l of lines) { sub += lineNilai(l); gross += num(l.jumlah) * num(l.harga); }
    sub = Math.round(sub * 100) / 100;
    const headerPers = Math.round(sub * num(form?.discPerst) * 100) / 10000;
    let after = sub - headerPers - num(form?.discNilai);
    for (const a of [form?.adj1, form?.adj2, form?.adj3, form?.adj4, form?.adj5]) after -= num(a);
    after = Math.round(after * 100) / 100;
    const ppn = num(form?.ppnPers) > 0 ? Math.round(after * num(form?.ppnPers)) / 100 : 0;
    return { gross: r2(gross), sub: r2(sub), disc: r2(gross - sub + headerPers + num(form?.discNilai)), nilai: r2(after), ppn: r2(ppn), retur: r2(after + ppn) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ returPenjualanById: Hdr }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.returPenjualanById, lines: d.returPenjualanById.lines ?? [] }); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus retur penjualan id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.pelangId) return setErr("Pelanggan wajib dipilih.");
    if ((form.lines ?? []).length === 0) return setErr("Minimal 1 baris barang.");
    setErr("");
    try {
      const input = {
        no: form.no || null, tanggal: form.tanggal || null, tglPajak: form.tglPajak || null,
        pelangId: form.pelangId, pelAlamat: form.pelAlamat || null, salesId: form.salesId ?? null,
        gudang: form.gudang ?? 1, divisiId: form.divisiId ?? null, jenpenId: form.jenpenId ?? null, cash: form.cash ?? false,
        mauang: form.mauang ?? 1, kurs: form.kurs || "1", kursPajak: form.kursPajak || "1",
        penjuaId: form.penjuaId ?? null, penjuaId2: form.penjuaId2 ?? null,
        discNilai: form.discNilai || "0", discPerst: form.discPerst || "0", ppnTipe: form.ppnTipe ?? 0, ppnPers: form.ppnPers || "0",
        adj1: form.adj1 || "0", adj2: form.adj2 || "0", adj3: form.adj3 || "0", adj4: form.adj4 || "0", adj5: form.adj5 || "0",
        termCrd: form.termCrd ?? null, catatan: form.catatan || null, catatan2: form.catatan2 || null, catatan3: form.catatan3 || null, alsBatal: form.alsBatal || null,
        lines: (form.lines ?? []).map((l) => ({
          stockId: l.stockId, satuan: l.satuan ?? null, satuanC: l.satuanC ?? null, satRusak: l.satRusak ?? null,
          jumlah: l.jumlah || "0", jmlRusak: l.jmlRusak || "0", bonSatuan: l.bonSatuan ?? null, bonJumlah: l.bonJumlah || "0",
          harga: l.harga || "0", discPers: l.discPers || "0", discPers2: l.discPers2 || "0", discPers3: l.discPers3 || "0",
          discNilai: l.discNilai || "0", hpp: l.hpp || "0", hppRusak: l.hppRusak || "0", dariMast: l.dariMast ?? false, catatan: l.catatan || null,
        })),
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  async function navTo(step: "first" | "prev" | "next" | "last") {
    if (!form) return;
    const asc = [...rows].sort((x, y) => x.id - y.id);
    const idx = asc.findIndex((r) => r.id === form.id);
    if (idx < 0) return;
    const t = step === "first" ? 0 : step === "last" ? asc.length - 1 : step === "prev" ? Math.max(0, idx - 1) : Math.min(asc.length - 1, idx + 1);
    const d = await gql<{ returPenjualanById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.returPenjualanById, lines: d.returPenjualanById.lines ?? [] });
    setLsel(0);
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Retur Penjualan</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button className="gf-3d bg-gf-menubar p-[1px]"><span className="px-2 text-[10px]">Menu Utama</span></button>
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">R E T U R&nbsp;&nbsp;P E N J U A L A N</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/laporan.png`} alt="Laporan" width={54} height={44} /></button>
            <button onClick={() => setMsg("Rincian Per Item — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/rincian.png`} alt="Rincian" width={52} height={44} /></button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak-setup.png`} alt="Cetak Setup" width={52} height={44} /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no retur / pelanggan..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="max-h-[300px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Gudang", "Mlk", "No Retur", "Tgl Retur", "Pelanggan", "Kurs", "MU", "Harga", "Discount", "...", "PJK/PPN", "%PJK/PPN", "Total", "Faktur Asal", "Potong Faktur", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.gudang}</td>
                    <td className={td} />
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.pelangNama}</td>
                    <td className={`${td} text-right`}>{r.kurs}</td>
                    <td className={td}>IDR</td>
                    <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                    <td className={`${td} text-right font-mono`}>{r.totDisc}</td>
                    <td className={td} />
                    <td className={td}>{r.ppnTipe ? "PJK" : "-"}</td>
                    <td className={`${td} text-right`}>{r.ppnPers}</td>
                    <td className={`${td} text-right font-mono`}>{r.totalRetur}</td>
                    <td className={td}>{r.penjuaNo}</td>
                    <td className={td}>{r.penjuaNo2}</td>
                    <td className={td}>{r.alsBatal}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={17} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1150px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Retur Penjualan — {mode === "create" ? "Tambah" : `Koreksi #${form.id}`}</div>
            <div className="grid grid-cols-2 gap-x-4 p-3 text-[12px]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">Faktur Asal :</span>
                  <select className="gf-3d w-full bg-white px-1 py-[2px]" value={form.penjuaId ?? ""} onChange={(e) => set({ penjuaId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{inv.map((p) => <option key={p.id} value={p.id}>{p.no ?? `#${p.id}`} ({p.totHarga ?? ""})</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">Potong pd Faktur :</span>
                  <select className="gf-3d w-full bg-white px-1 py-[2px]" value={form.penjuaId2 ?? ""} onChange={(e) => set({ penjuaId2: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{inv.map((p) => <option key={p.id} value={p.id}>{p.no ?? `#${p.id}`}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">Pelanggan :</span>
                  <select className="gf-3d w-full bg-white px-1 py-[2px]" value={form.pelangId ?? ""} onChange={(e) => set({ pelangId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">*** BELUM DIPILIH ***</option>{pel.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMsg("Kirim Ke — isi alamat kirim (menyusul 1:1 penuh)")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Kirim Ke</button>
                  <input className="gf-3d flex-1 bg-white px-[6px] py-[2px]" value={jev(form.pelAlamat)} onChange={(e) => set({ pelAlamat: e.target.value })} placeholder="Alamat kirim..." />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">Sales :</span>
                  <input className="gf-3d w-[70px] bg-white px-2 py-[2px]" value={form.salesId ?? ""} onChange={(e) => set({ salesId: e.target.value ? Number(e.target.value) : null })} />
                  <span className="w-[110px] shrink-0">Catatan :</span>
                  <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">Gudang :</span>
                  <input className="gf-3d w-[70px] bg-white px-2 py-[2px]" value={form.gudang ?? ""} onChange={(e) => set({ gudang: e.target.value ? Number(e.target.value) : 1 })} />
                  <span className="w-[110px] shrink-0">No Retur :</span>
                  <input className="gf-3d w-[80px] bg-white px-2 py-[2px]" value={jev(form.no)} onChange={(e) => set({ no: e.target.value })} placeholder="(auto)" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">Tgl Retur :</span>
                  <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                  <span className="w-[110px] shrink-0">Tgl Pajak :</span>
                  <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={jev(form.tglPajak)} onChange={(e) => set({ tglPajak: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">MU / Kurs :</span>
                  <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}><option value={1}>IDR</option></select>
                  <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right" value={jev(form.kurs)} onChange={(e) => set({ kurs: e.target.value })} title="Kurs" />
                  <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right" value={jev(form.kursPajak)} onChange={(e) => set({ kursPajak: e.target.value })} title="Kurs Pajak" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[110px] shrink-0">PPN :</span>
                  <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                  <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right" value={jev(form.ppnPers)} onChange={(e) => set({ ppnPers: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3">
              <button onClick={() => set({ lines: [...(form.lines ?? []), { ...emptyLine(), dariMast: true }] })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah Dari Master</button>
              <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()] })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
              <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
              <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel) })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
            </div>

            <div className="px-3 pt-1">
              <div className="max-h-[230px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-gf-menubar">
                    {["No", "Kode", "Nama", "Sat", "Jumlah", "Rusak", "Bonus", "@", "Harga", "Disc%", "Disc%2", "Disc%3", "Disc Rp", "Nilai", "Catatan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>{i + 1}</td>
                        <td className={`${td} w-[54px]`}>{l.stockId}</td>
                        <td className={`${td} min-w-[150px]`}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[40px]`} value={jev(l.satuanC)} onChange={(e) => setLine(i, { satuanC: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[52px]`} value={jev(l.jumlah)} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[46px]`} value={jev(l.jmlRusak)} onChange={(e) => setLine(i, { jmlRusak: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[46px]`} value={jev(l.bonJumlah)} onChange={(e) => setLine(i, { bonJumlah: e.target.value })} /></td>
                        <td className={td}>x</td>
                        <td className={td}><input className={`${tin} w-[76px] font-mono`} value={jev(l.harga)} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[40px]`} value={jev(l.discPers)} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[40px]`} value={jev(l.discPers2)} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[40px]`} value={jev(l.discPers3)} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[60px] font-mono`} value={jev(l.discNilai)} onChange={(e) => setLine(i, { discNilai: e.target.value })} /></td>
                        <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                        <td className={td}><input className={`${tin} w-[70px] text-left`} value={jev(l.catatan)} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                    {(form.lines ?? []).length === 0 && <tr><td colSpan={15} className="px-2 py-3 text-center text-gf-muted">Belum ada baris. Gunakan Tambah / Tambah Dari Master.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_380px] gap-3 px-3 pt-2 text-[12px]">
              <div className="grid grid-cols-[110px_1fr_110px_1fr] items-center gap-x-2 gap-y-[3px]">
                <span>Total Nilai :</span><input className="gf-3d bg-[#eef7d6] px-2 py-[1px] text-right font-mono" readOnly value={totals.nilai} />
                <span>Discount :</span>
                <div className="flex items-center gap-1">
                  <input className="gf-3d w-[70px] bg-white px-2 py-[1px] text-right" value={jev(form.discPerst)} onChange={(e) => set({ discPerst: e.target.value })} title="Disc %" />
                  <input className="gf-3d w-[90px] bg-white px-2 py-[1px] text-right" value={jev(form.discNilai)} onChange={(e) => set({ discNilai: e.target.value })} title="Disc Rp" />
                </div>
                <span>Total Harga :</span><input className="gf-3d bg-[#eef7d6] px-2 py-[1px] text-right font-mono" readOnly value={totals.gross} />
                <span>PPN :</span><input className="gf-3d bg-[#eef7d6] px-2 py-[1px] text-right font-mono" readOnly value={totals.ppn} />
                <span>Total Disc :</span><input className="gf-3d bg-[#eef7d6] px-2 py-[1px] text-right font-mono" readOnly value={totals.disc} />
                <span>Total Retur :</span><input className="gf-3d bg-[#ffe9a8] px-2 py-[1px] text-right font-mono font-bold" readOnly value={totals.retur} />
                <span>Adj 1-5 :</span>
                <div className="col-span-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <input key={i} className="gf-3d w-[80px] bg-white px-2 py-[1px] text-right" value={jev(form[`adj${i}` as keyof Hdr] as string | null)} onChange={(e) => set({ [`adj${i}`]: e.target.value } as Partial<Hdr>)} />
                  ))}
                </div>
                <span>Catatan :</span>
                <div className="col-span-3 space-y-1">
                  <input className="gf-3d w-full bg-white px-2 py-[1px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
                  <input className="gf-3d w-full bg-white px-2 py-[1px]" value={jev(form.catatan2)} onChange={(e) => set({ catatan2: e.target.value })} />
                  <input className="gf-3d w-full bg-white px-2 py-[1px]" value={jev(form.catatan3)} onChange={(e) => set({ catatan3: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col justify-end gap-2">
                <div className="text-[11px]">Alasan Batal / Catatan : <input className="gf-3d w-full bg-white px-2 py-[1px]" value={jev(form.alsBatal)} onChange={(e) => set({ alsBatal: e.target.value })} /></div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1 border-t border-gf-border p-2">
              <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Tutup Menu</button>
              {["<<", "<", ">", ">>"].map((t) => (
                <button key={t} onClick={() => navTo(t === "<<" ? "first" : t === "<" ? "prev" : t === ">" ? "next" : "last")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{t}</button>
              ))}
              <button onClick={() => set({ cash: !form.cash })} className={`gf-3d px-3 py-[2px] text-[11px] font-bold ${form.cash ? "bg-[#ffe9a8] text-green-800" : "bg-gf-menubar"}`}>C R E D I T</button>
              <button onClick={onSimpan} className="gf-3d ml-auto w-[300px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
              <button onClick={() => setForm(null)} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
            </div>
            {err && <div className="px-3 pb-2 text-[12px] text-red-700">{err}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
