"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; tanggal?: string | null; divisiId?: number | null; prditmId?: number | null; jumlah?: string | null; catatan?: string | null };
type Ref = { id: number; nama: string };

const FIELDS = `id tanggal divisiId prditmId jumlah catatan`;
const LIST = `query($q:String){ produksiList(q:$q){ total rows { ${FIELDS} } } }`;
const BYID = `query($id:Int!){ produksiById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:ProduksiInput!){ createProduksi(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:ProduksiInput!){ updateProduksi(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteProduksi(id:$id) }`;
const REFS = `{ divisiRefList { id nama } }`;

const empty = (): Row => ({ id: 0, tanggal: new Date().toISOString().slice(0, 10), divisiId: null, prditmId: null, jumlah: "0", catatan: "" });

export default function ProduksiPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ produksiList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.produksiList.rows); setTotal(d.produksiList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ divisiRefList: Ref[] }>(REFS).then((d) => setDivisi(d.divisiRefList)).catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ produksiById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.produksiById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus produksi id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    const input = { tanggal: form.tanggal || null, divisiId: form.divisiId ?? null, prditmId: form.prditmId ?? null, jumlah: form.jumlah || "0", catatan: form.catatan || null };
    if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1000px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Barang Produksi</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;P R O D U K S I</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari catatan..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Tambah</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["ID", "Tanggal", "Divisi", "Item Produksi", "Jumlah", "Catatan"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{divisi.find((d) => d.id === r.divisiId)?.nama ?? r.divisiId}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.prditmId}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.jumlah}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1000px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
          <div className="w-[720px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Barang Produksi — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="space-y-1 p-3 text-[12px]">
              <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
              <F label="Tanggal :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} /></F>
              <F label="Divisi :">
                <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
              </F>
              <F label="Item Produksi :"><input type="number" className="gf-3d w-[140px] bg-white px-2 py-[2px]" placeholder="id item produksi" value={form.prditmId ?? ""} onChange={(e) => set({ prditmId: e.target.value ? Number(e.target.value) : null })} /></F>
              <F label="Jumlah :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.jumlah ?? ""} onChange={(e) => set({ jumlah: e.target.value })} /></F>
              <F label="Catatan :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} /></F>
            </div>
            {err && <div className="px-3 pb-1 text-[12px] text-red-700">{err}</div>}
            <div className="flex gap-2 border-t border-gf-border p-2">
              <button className="gf-3d bg-gf-panel px-4 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onSimpan}>Simpan</button>
              <button className="gf-3d bg-gf-panel px-4 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={() => setForm(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-2"><span className="w-[110px] shrink-0">{label}</span>{children}</div>;
}
