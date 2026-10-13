"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  id: number;
  nama: string;
  alamat?: string | null;
  telepon?: string | null;
  komisi?: string | null;
  catatan?: string | null;
  nonAktif?: string | null;
  sales?: boolean;
  supir?: boolean;
  helper?: boolean;
  collector?: boolean;
  admin?: boolean;
  jenpenId?: number | null;
  divisiId?: number | null;
};
type Ref = { id: number; nama: string };

const LIST = `query($q:String){ karyawanList(q:$q){ total rows { id nama alamat telepon komisi catatan nonAktif sales supir helper collector admin jenpenId divisiId } } }`;
const REFS = `{ jenpenRefList { id nama } divisiRefList { id nama } }`;
const BYID = `query($id:Int!){ karyawanById(id:$id){ id nama alamat telepon komisi catatan nonAktif sales supir helper collector admin jenpenId divisiId } }`;
const CREATE = `mutation($input:KaryawanInput!){ createKaryawan(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:KaryawanInput!){ updateKaryawan(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteKaryawan(id:$id) }`;

const empty = (): Row => ({
  id: 0, nama: "", alamat: "", telepon: "", komisi: "", catatan: "", nonAktif: "",
  sales: false, supir: false, helper: false, collector: false, admin: false, jenpenId: null, divisiId: null,
});

function tipe(r: Row): string {
  const t = [r.sales && "Sales", r.supir && "Supir", r.helper && "Helper", r.collector && "Collector", r.admin && "Admin"].filter(Boolean);
  return t.join(", ");
}

export default function KaryawanPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [jenpen, setJenpen] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ karyawanList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.karyawanList.rows);
    setTotal(d.karyawanList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ jenpenRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setJenpen(d.jenpenRefList); setDivisi(d.divisiRefList); })
      .catch(() => {});
  }, [load]);

  async function onTambah() {
    setErr(""); setMode("create"); setForm(empty());
  }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ karyawanById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.karyawanById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus karyawan id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }

  async function onSimpan() {
    if (!form) return;
    if (!form.nama.trim()) return setErr("Nama wajib diisi.");
    setErr("");
    const input = {
      nama: form.nama.trim(), alamat: form.alamat || null, telepon: form.telepon || null,
      komisi: form.komisi || null, catatan: form.catatan || null, nonAktif: form.nonAktif || null,
      sales: !!form.sales, supir: !!form.supir, helper: !!form.helper, collector: !!form.collector,
      admin: !!form.admin, jenpenId: form.jenpenId ?? null, divisiId: form.divisiId ?? null,
    };
    if (mode === "create") await gql(CREATE, { input });
    else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1150px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Karyawan</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">
            M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;K A R Y A W A N
          </div>
          <div className="mb-2 flex items-center gap-2">
            <input
              className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]"
              placeholder="Cari nama..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Tambah</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>

          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-gf-menubar">
                  {["ID", "Nama", "Alamat", "Tipe", "Komisi", "Telepon", "Non-Aktif", "Catatan"].map((h) => (
                    <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSel(r.id)}
                    className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}
                  >
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.alamat}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{tipe(r)}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.komisi ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nonAktif}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1150px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-6">
          <div className="w-[860px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Karyawan — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 text-[12px]">
              <div className="space-y-1">
                <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
                <F label="Nama :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.nama} onChange={(e) => set({ nama: e.target.value })} /></F>
                <F label="Alamat :"><textarea className="gf-3d w-full bg-white px-2 py-[2px]" rows={2} value={form.alamat ?? ""} onChange={(e) => set({ alamat: e.target.value })} /></F>
                <F label="Telepon :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.telepon ?? ""} onChange={(e) => set({ telepon: e.target.value })} /></F>
                <F label="Komisi :"><input className="gf-3d w-[120px] bg-white px-2 py-[2px] text-right font-mono" value={form.komisi ?? ""} onChange={(e) => set({ komisi: e.target.value })} /></F>
                <F label="Catatan :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} /></F>
                <F label="Non-Aktif :"><input type="date" className="gf-3d w-[170px] bg-white px-2 py-[2px]" value={form.nonAktif ?? ""} onChange={(e) => set({ nonAktif: e.target.value })} /></F>
                <F label="Jenis Penj :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.jenpenId ?? ""} onChange={(e) => set({ jenpenId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>
                    {jenpen.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                  </select>
                </F>
                <F label="Divisi :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--semua divisi--</option>
                    {divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </F>
              </div>
              <div className="space-y-1 pt-6">
                {(["sales", "supir", "helper", "collector", "admin"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2 capitalize">
                    <input type="checkbox" checked={!!form[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<Row>)} />
                    {k}
                  </label>
                ))}
              </div>
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
  return (
    <div className="flex items-center gap-2">
      <span className="w-[80px] shrink-0">{label}</span>
      {children}
    </div>
  );
}
