"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; tanggal1?: string | null; tanggal2?: string | null; pukul1?: number | null; pukul2?: number | null; hari?: string | null; penjEcr?: boolean; penjCsh?: boolean; penjCrd?: boolean; semuaKomp?: boolean; divisi?: string | null; catatan?: string | null };

const FIELDS = `id tanggal1 tanggal2 pukul1 pukul2 hari penjEcr penjCsh penjCrd semuaKomp divisi catatan`;
const LIST = `query($q:String){ promosiList(q:$q){ total rows { ${FIELDS} } } }`;
const BYID = `query($id:Int!){ promosiById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:PromosiInput!){ createPromosi(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PromosiInput!){ updatePromosi(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePromosi(id:$id) }`;

const empty = (): Row => ({ id: 0, tanggal1: new Date().toISOString().slice(0, 10), tanggal2: new Date().toISOString().slice(0, 10), pukul1: 0, pukul2: 2359, penjEcr: true, penjCsh: true, penjCrd: true, semuaKomp: false, divisi: "", catatan: "" });

export default function PromosiPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ promosiList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.promosiList.rows); setTotal(d.promosiList.total);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ promosiById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.promosiById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus promosi id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.tanggal1 || !form.tanggal2) return setErr("Rentang tanggal wajib diisi.");
    setErr("");
    const input = { tanggal1: form.tanggal1, tanggal2: form.tanggal2, pukul1: form.pukul1 ?? null, pukul2: form.pukul2 ?? null, hari: form.hari || null, penjEcr: !!form.penjEcr, penjCsh: !!form.penjCsh, penjCrd: !!form.penjCrd, semuaKomp: !!form.semuaKomp, divisi: form.divisi || null, catatan: form.catatan || null };
    if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1100px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Promosi</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">P R O M O S I</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari catatan..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Tambah</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["ID", "Dari", "Sampai", "Pukul", "Eceran", "Cash", "Kredit", "Catatan"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal1}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal2}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.pukul1}-{r.pukul2}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.penjEcr ? "Y" : "-"}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.penjCsh ? "Y" : "-"}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.penjCrd ? "Y" : "-"}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1100px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
          <div className="w-[760px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Promosi — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="space-y-1 p-3 text-[12px]">
              <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
              <F label="Tanggal :"><input type="date" className="gf-3d w-[170px] bg-white px-2 py-[2px]" value={form.tanggal1 ?? ""} onChange={(e) => set({ tanggal1: e.target.value })} /> <span>-</span> <input type="date" className="gf-3d w-[170px] bg-white px-2 py-[2px]" value={form.tanggal2 ?? ""} onChange={(e) => set({ tanggal2: e.target.value })} /></F>
              <F label="Pukul :"><input type="number" className="gf-3d w-[100px] bg-white px-2 py-[2px]" placeholder="0" value={form.pukul1 ?? ""} onChange={(e) => set({ pukul1: e.target.value ? Number(e.target.value) : null })} /> <span>-</span> <input type="number" className="gf-3d w-[100px] bg-white px-2 py-[2px]" placeholder="2359" value={form.pukul2 ?? ""} onChange={(e) => set({ pukul2: e.target.value ? Number(e.target.value) : null })} /></F>
              <F label="Hari :"><input className="gf-3d w-full bg-white px-2 py-[2px]" placeholder="mis. Senin,Selasa (kosong=semua)" value={form.hari ?? ""} onChange={(e) => set({ hari: e.target.value })} /></F>
              <div className="flex gap-4 py-1">
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.penjEcr} onChange={(e) => set({ penjEcr: e.target.checked })} /> Penj Eceran</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.penjCsh} onChange={(e) => set({ penjCsh: e.target.checked })} /> Penj Cash</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.penjCrd} onChange={(e) => set({ penjCrd: e.target.checked })} /> Penj Credit</label>
              </div>
              <F label="Divisi :"><input className="gf-3d w-full bg-white px-2 py-[2px]" placeholder="kosong = semua divisi" value={form.divisi ?? ""} onChange={(e) => set({ divisi: e.target.value })} /></F>
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
  return <div className="flex items-center gap-2"><span className="w-[90px] shrink-0">{label}</span>{children}</div>;
}
