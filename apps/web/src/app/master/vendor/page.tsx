"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  id: number; nama: string; npwp?: string | null; alamat?: string | null; kodePos?: string | null;
  daerahId?: number | null; telepon?: string | null; telepon2?: string | null; telepon3?: string | null;
  fax?: string | null; rekening1?: string | null; rekening2?: string | null; rekening3?: string | null;
  email?: string | null; website?: string | null; hubungi?: string | null; hubTelp1?: string | null;
  termCrd?: number | null; maxCrd?: string | null; ppnTipe?: number | null; ppnPers?: string | null;
  groupVenId?: number | null; divisiId?: number | null; catatan?: string | null;
};
type Ref = { id: number; nama: string };

const FIELDS = `id nama npwp alamat kodePos daerahId telepon telepon2 telepon3 fax rekening1 rekening2 rekening3 email website hubungi hubTelp1 termCrd maxCrd ppnTipe ppnPers groupVenId divisiId catatan`;
const LIST = `query($q:String){ vendorList(q:$q){ total rows { ${FIELDS} } } }`;
const REFS = `{ daerahRefList { id nama } grpvenRefList { id nama } divisiRefList { id nama } }`;
const BYID = `query($id:Int!){ vendorById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:VendorInput!){ createVendor(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:VendorInput!){ updateVendor(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteVendor(id:$id) }`;

const empty = (): Row => ({ id: 0, nama: "", npwp: "", alamat: "", kodePos: "", daerahId: null, telepon: "", telepon2: "", telepon3: "", fax: "", rekening1: "", rekening2: "", rekening3: "", email: "", website: "", hubungi: "", hubTelp1: "", termCrd: null, maxCrd: "", ppnTipe: null, ppnPers: "", groupVenId: null, divisiId: null, catatan: "" });

export default function VendorPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [daerah, setDaerah] = useState<Ref[]>([]);
  const [grpven, setGrpven] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ vendorList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.vendorList.rows); setTotal(d.vendorList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ daerahRefList: Ref[]; grpvenRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setDaerah(d.daerahRefList); setGrpven(d.grpvenRefList); setDivisi(d.divisiRefList); })
      .catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ vendorById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.vendorById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus vendor id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.nama.trim()) return setErr("Nama wajib diisi.");
    setErr("");
    const input: Record<string, unknown> = { nama: form.nama.trim() };
    for (const k of ["npwp", "alamat", "kodePos", "telepon", "telepon2", "telepon3", "fax", "rekening1", "rekening2", "rekening3", "email", "website", "hubungi", "hubTelp1", "maxCrd", "ppnPers", "catatan"] as const) {
      input[k] = (form as Record<string, unknown>)[k] || null;
    }
    for (const k of ["daerahId", "termCrd", "ppnTipe", "groupVenId", "divisiId"] as const) {
      input[k] = (form as Record<string, unknown>)[k] ?? null;
    }
    if (mode === "create") await gql(CREATE, { input });
    else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Vendor</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut A..Z")} className="gf-3d bg-gf-menubar p-[1px]" title="A..Z">
              <Image src="/gf-icons/screens/vendor/a-z.png" alt="A..Z" width={38} height={27} unoptimized />
            </button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]" title="Menu">
              <Image src="/gf-icons/screens/vendor/menu.png" alt="Menu" width={74} height={27} unoptimized />
            </button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;V E N D O R</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" title="Filter Divisi">
              <option>(-Semua Divisi-)</option>
            </select>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]" title="Laporan">
              <Image src="/gf-icons/screens/vendor/laporan.png" alt="Laporan" width={58} height={44} unoptimized />
            </button>
            <button onClick={() => setMsg("Kelompok (Grouping Vendor) — menyusul")} className="gf-3d bg-gf-menubar p-[1px]" title="Kelompok">
              <Image src="/gf-icons/screens/vendor/kelompok.png" alt="Kelompok" width={57} height={44} unoptimized />
            </button>
            <button onClick={() => setMsg("Sisa Hutang — menyusul")} className="gf-3d bg-gf-menubar p-[1px]" title="Sisa Hutang">
              <Image src="/gf-icons/screens/vendor/sisa-hutang.png" alt="Sisa Hutang" width={61} height={44} unoptimized />
            </button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari nama..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]" title="Tambah">
              <Image src="/gf-icons/screens/vendor/tambah.png" alt="Tambah" width={58} height={44} unoptimized />
            </button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`} title="Koreksi">
              <Image src="/gf-icons/screens/vendor/koreksi.png" alt="Koreksi" width={58} height={44} unoptimized />
            </button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`} title="Hapus">
              <Image src="/gf-icons/screens/vendor/hapus.png" alt="Hapus" width={58} height={44} unoptimized />
            </button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]" title="Tutup">
              <Image src="/gf-icons/screens/vendor/tutup.png" alt="Tutup" width={56} height={44} unoptimized />
            </button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">
                {["ID", "Tipe", "NPWP", "Nama", "Alamat", "Daerah", "Negara", "Telepon", "Telp(2)", "Telp(3)", "Fax", "Rekening"].map((h) => (
                  <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.ppnTipe}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.npwp}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.alamat}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{daerah.find((d) => d.id === r.daerahId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">Indonesia</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon2}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon3}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.fax}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.rekening1}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={12} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1250px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
          <div className="w-[1000px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Vendor — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 text-[12px]">
              <div className="space-y-1">
                <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
                <F label="Nama :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.nama} onChange={(e) => set({ nama: e.target.value })} /></F>
                <F label="Alamat :"><textarea className="gf-3d w-full bg-white px-2 py-[2px]" rows={2} value={form.alamat ?? ""} onChange={(e) => set({ alamat: e.target.value })} /></F>
                <F label="Kode Pos :"><input className="gf-3d w-[120px] bg-white px-2 py-[2px]" value={form.kodePos ?? ""} onChange={(e) => set({ kodePos: e.target.value })} /></F>
                <F label="Daerah :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.daerahId ?? ""} onChange={(e) => set({ daerahId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{daerah.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </F>
                <F label="NPWP :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.npwp ?? ""} onChange={(e) => set({ npwp: e.target.value })} /></F>
                <F label="Telepon :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.telepon ?? ""} onChange={(e) => set({ telepon: e.target.value })} /></F>
                <F label="Telp(2) :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.telepon2 ?? ""} onChange={(e) => set({ telepon2: e.target.value })} /></F>
                <F label="Telp(3) :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.telepon3 ?? ""} onChange={(e) => set({ telepon3: e.target.value })} /></F>
                <F label="Fax :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.fax ?? ""} onChange={(e) => set({ fax: e.target.value })} /></F>
                <F label="Rekening :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.rekening1 ?? ""} onChange={(e) => set({ rekening1: e.target.value })} /></F>
                <F label="Credit :"><input type="number" className="gf-3d w-[120px] bg-white px-2 py-[2px]" value={form.termCrd ?? ""} onChange={(e) => set({ termCrd: e.target.value ? Number(e.target.value) : null })} /></F>
                <F label="Max Crd :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.maxCrd ?? ""} onChange={(e) => set({ maxCrd: e.target.value })} /></F>
              </div>
              <div className="space-y-1">
                <F label="Hubungi :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.hubungi ?? ""} onChange={(e) => set({ hubungi: e.target.value })} /></F>
                <F label="Hub Telp :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.hubTelp1 ?? ""} onChange={(e) => set({ hubTelp1: e.target.value })} /></F>
                <F label="Email :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></F>
                <F label="Website :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.website ?? ""} onChange={(e) => set({ website: e.target.value })} /></F>
                <F label="Kelompok :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.groupVenId ?? ""} onChange={(e) => set({ groupVenId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{grpven.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                  </select>
                </F>
                <F label="Divisi :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--semua divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </F>
                <F label="Pajak % :"><input className="gf-3d w-[120px] bg-white px-2 py-[2px] text-right font-mono" value={form.ppnPers ?? ""} onChange={(e) => set({ ppnPers: e.target.value })} /></F>
                <F label="Catatan :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} /></F>
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
  return <div className="flex items-center gap-2"><span className="w-[80px] shrink-0">{label}</span>{children}</div>;
}
