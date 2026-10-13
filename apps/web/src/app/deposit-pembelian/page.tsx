"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; no?: string | null; tanggal?: string | null; vendorId?: number | null; vendorNama?: string | null; divisiId?: number | null; purcorId?: number | null; pembelId?: number | null; deposit?: string | null; catatan?: string | null };
type Ref = { id: number; nama: string };

const FIELDS = `id no tanggal vendorId vendorNama divisiId purcorId pembelId deposit catatan`;
const LIST = `query($q:String){ depositPembelianList(q:$q){ total rows { ${FIELDS} } } }`;
const BYID = `query($id:Int!){ depositPembelianById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:DepositPembelianInput!){ createDepositPembelian(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:DepositPembelianInput!){ updateDepositPembelian(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteDepositPembelian(id:$id) }`;
const REFS = `{ vendorRefList { id nama } divisiRefList { id nama } }`;

const empty = (): Row => ({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), vendorId: null, divisiId: null, purcorId: null, pembelId: null, deposit: "", catatan: "" });

export default function DepositPembelianPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [vendor, setVendor] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ depositPembelianList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.depositPembelianList.rows); setTotal(d.depositPembelianList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setVendor(d.vendorRefList); setDivisi(d.divisiRefList); }).catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ depositPembelianById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.depositPembelianById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus deposit id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.vendorId) return setErr("Vendor wajib dipilih.");
    if (!form.deposit || Number(form.deposit) <= 0) return setErr("Deposit wajib > 0.");
    setErr("");
    const input = { no: form.no || null, tanggal: form.tanggal || null, vendorId: form.vendorId, divisiId: form.divisiId ?? null, purcorId: form.purcorId ?? null, pembelId: form.pembelId ?? null, deposit: form.deposit || "0", catatan: form.catatan || null };
    if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Deposit Pembelian</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">D E P O S I T&nbsp;&nbsp;P E M B E L I A N</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / vendor..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Tambah</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["ID", "No", "Tanggal", "Vendor", "Deposit"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.no}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.vendorNama}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.deposit}</td>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
          <div className="w-[820px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Deposit Pembelian — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="space-y-1 p-3 text-[12px]">
              <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
              <F label="Vendor :">
                <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">-- pilih vendor --</option>{vendor.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
              </F>
              <F label="Divisi :">
                <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
              </F>
              <F label="Nomor :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value })} /></F>
              <F label="Tanggal :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} /></F>
              <F label="Pembelian :"><input type="number" className="gf-3d w-[160px] bg-white px-2 py-[2px]" placeholder="id pembelian" value={form.pembelId ?? ""} onChange={(e) => set({ pembelId: e.target.value ? Number(e.target.value) : null })} /></F>
              <F label="Deposit :"><input className="gf-3d w-[200px] bg-white px-2 py-[2px] text-right font-mono" value={form.deposit ?? ""} onChange={(e) => set({ deposit: e.target.value })} /></F>
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
  return <div className="flex items-center gap-2"><span className="w-[100px] shrink-0">{label}</span>{children}</div>;
}
