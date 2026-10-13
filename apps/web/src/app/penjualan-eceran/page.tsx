"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Line = { stockId: number; jumlah?: string; harga?: string; discPers?: string; catatan?: string };
type Hdr = { id: number; no?: string | null; tanggal?: string | null; pelangId?: number | null; pelNama?: string | null; gudang?: number | null; total?: string | null; catatan?: string | null; lines?: Line[] };
type Ref = { id: number; nama: string };

const LIST = `query($q:String){ posList(q:$q){ total rows { id no tanggal pelNama total } } }`;
const BYID = `query($id:Int!){ posById(id:$id){ id no tanggal pelangId pelNama gudang total catatan lines { stockId jumlah harga discPers catatan } } }`;
const CREATE = `mutation($input:PosInput!){ createPos(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PosInput!){ updatePos(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePos(id:$id) }`;
const REFS = `{ pelangganRefList { id nama } itemList(limit:500) { rows { id nama } } }`;

const emptyHdr = (): Hdr => ({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), pelangId: null, gudang: 1, catatan: "", lines: [] });

export default function PosPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [pel, setPel] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [bayar, setBayar] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ posList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.posList.rows); setTotal(d.posList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ pelangganRefList: Ref[]; itemList: { rows: Ref[] } }>(REFS)
      .then((d) => { setPel(d.pelangganRefList); setItems(d.itemList.rows); }).catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(emptyHdr()); setBayar(""); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ posById: Hdr }>(BYID, { id: sel });
    setForm({ ...emptyHdr(), ...d.posById, lines: d.posById.lines ?? [] }); setBayar("");
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus penjualan eceran id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.lines || form.lines.length === 0) return setErr("Minimal 1 barang.");
    setErr("");
    const input = { no: form.no || null, tanggal: form.tanggal || null, pelangId: form.pelangId ?? null, gudang: form.gudang ?? null, catatan: form.catatan || null, lines: form.lines.map((l) => ({ stockId: l.stockId, jumlah: l.jumlah || "0", harga: l.harga || "0", discPers: l.discPers || "0", catatan: l.catatan || null })) };
    if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Transaksi tersimpan." : "Diperbarui."); await load();
  }

  const setH = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) => setForm((f) => { if (!f) return f; const ls = [...(f.lines ?? [])]; ls[i] = { ...ls[i], ...patch }; return { ...f, lines: ls }; });
  const addLine = () => setForm((f) => (f ? { ...f, lines: [...(f.lines ?? []), { stockId: items[0]?.id ?? 0, jumlah: "1", harga: "0", discPers: "0" }] } : f));
  const delLine = (i: number) => setForm((f) => (f ? { ...f, lines: (f.lines ?? []).filter((_, x) => x !== i) } : f));
  const tot = (form?.lines ?? []).reduce((s, l) => { const g = Number(l.jumlah || 0) * Number(l.harga || 0); return s + g - g * Number(l.discPers || 0) / 100; }, 0);
  const kembali = Number(bayar || 0) - tot;

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Penjualan Eceran (POS)</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">P E N J U A L A N&nbsp;&nbsp;E C E R A N</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / pelanggan..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Transaksi Baru</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["ID", "No", "Tanggal", "Pelanggan", "Total"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.no}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.pelNama}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.total}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1250px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[1100px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Penjualan Eceran — {mode === "create" ? "Transaksi Baru" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 text-[12px]">
              <div className="space-y-1">
                <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
                <F label="No :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => setH({ no: e.target.value })} /></F>
                <F label="Pelanggan :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.pelangId ?? ""} onChange={(e) => setH({ pelangId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">-- umum --</option>{pel.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                  </select>
                </F>
              </div>
              <div className="space-y-1">
                <F label="Tanggal :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => setH({ tanggal: e.target.value })} /></F>
                <F label="Gudang :"><input type="number" className="gf-3d w-[100px] bg-white px-2 py-[2px]" value={form.gudang ?? ""} onChange={(e) => setH({ gudang: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="Catatan :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => setH({ catatan: e.target.value })} /></F>
              </div>
            </div>
            <div className="px-3">
              <div className="mb-1"><button className="gf-3d bg-gf-panel px-3 py-[2px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={addLine}>Tambah Barang (F4)</button></div>
              <table className="w-full border-collapse text-[12px]">
                <thead><tr className="bg-gf-menubar">{["Barang", "Jumlah", "Harga", "Disc %", "Catatan", ""].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {(form.lines ?? []).map((l, i) => (
                    <tr key={i}>
                      <td className="border border-gf-border px-1 py-[2px]"><select className="w-full bg-white" value={l.stockId} onChange={(e) => setLine(i, { stockId: Number(e.target.value) })}>{items.map((it) => <option key={it.id} value={it.id}>{it.nama}</option>)}</select></td>
                      <td className="border border-gf-border px-1 py-[2px]"><input className="w-[80px] bg-white text-right font-mono" value={l.jumlah ?? ""} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                      <td className="border border-gf-border px-1 py-[2px]"><input className="w-[110px] bg-white text-right font-mono" value={l.harga ?? ""} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                      <td className="border border-gf-border px-1 py-[2px]"><input className="w-[70px] bg-white text-right font-mono" value={l.discPers ?? ""} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                      <td className="border border-gf-border px-1 py-[2px]"><input className="w-full bg-white" value={l.catatan ?? ""} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      <td className="border border-gf-border px-1 py-[2px] text-center"><button className="text-red-700" onClick={() => delLine(i)}>✕</button></td>
                    </tr>
                  ))}
                  {(form.lines ?? []).length === 0 && <tr><td colSpan={6} className="px-2 py-2 text-center text-gf-muted">Belum ada barang.</td></tr>}
                </tbody>
              </table>
              <div className="mt-2 flex items-center justify-end gap-6 text-[13px]">
                <span>TOTAL: <b className="font-mono">{tot.toFixed(2)}</b></span>
                <span>Bayar: <input className="gf-3d w-[140px] bg-white px-2 py-[2px] text-right font-mono" value={bayar} onChange={(e) => setBayar(e.target.value)} /></span>
                <span className={kembali < 0 ? "text-red-700" : ""}>Kembali: <b className="font-mono">{kembali.toFixed(2)}</b></span>
              </div>
            </div>
            {err && <div className="px-3 pt-2 text-[12px] text-red-700">{err}</div>}
            <div className="mt-2 flex gap-2 border-t border-gf-border p-2">
              <button className="gf-3d bg-gf-panel px-4 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onSimpan}>Simpan (F12)</button>
              <button className="gf-3d bg-gf-panel px-4 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={() => setForm(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-2"><span className="w-[90px] shrink-0">{label}</span>{children}</div>;
}
