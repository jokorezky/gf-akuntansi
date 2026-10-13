"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  id: number; nama: string; barcode?: string | null; nama2?: string | null; vendorId?: number | null;
  groupStkId?: number | null; jenis?: number | null; hargaBeli?: string | null; hargaJual1?: string | null;
  hargaJual2?: string | null; hargaJual3?: string | null; hargaJual4?: string | null; hargaJual5?: string | null;
  minStock?: string | null; tipeSatu?: number | null; satDef?: number | null; nonPajak?: boolean; expired?: boolean; catatan?: string | null;
};
type Ref = { id: number; nama: string };

const FIELDS = `id nama barcode nama2 vendorId groupStkId jenis hargaBeli hargaJual1 hargaJual2 hargaJual3 hargaJual4 hargaJual5 minStock tipeSatu satDef nonPajak expired catatan`;
const LIST = `query($q:String){ itemList(q:$q){ total rows { ${FIELDS} } } }`;
const REFS = `{ vendorRefList { id nama } grpstkRefList { id nama } }`;
const BYID = `query($id:Int!){ itemById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:ItemInput!){ createItem(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:ItemInput!){ updateItem(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteItem(id:$id) }`;

const empty = (): Row => ({ id: 0, nama: "", barcode: "", nama2: "", vendorId: null, groupStkId: null, jenis: null, hargaBeli: "", hargaJual1: "", hargaJual2: "", hargaJual3: "", hargaJual4: "", hargaJual5: "", minStock: "", tipeSatu: null, satDef: null, nonPajak: false, expired: false, catatan: "" });

export default function ItemPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [vendor, setVendor] = useState<Ref[]>([]);
  const [grp, setGrp] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ itemList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.itemList.rows); setTotal(d.itemList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[]; grpstkRefList: Ref[] }>(REFS)
      .then((d) => { setVendor(d.vendorRefList); setGrp(d.grpstkRefList); }).catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ itemById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.itemById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus item id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.nama.trim()) return setErr("Nama wajib diisi.");
    setErr("");
    const input: Record<string, unknown> = { nama: form.nama.trim() };
    for (const k of ["barcode", "nama2", "hargaBeli", "hargaJual1", "hargaJual2", "hargaJual3", "hargaJual4", "hargaJual5", "minStock", "catatan"] as const) input[k] = (form as Record<string, unknown>)[k] || null;
    for (const k of ["vendorId", "groupStkId", "jenis", "tipeSatu", "satDef"] as const) input[k] = (form as Record<string, unknown>)[k] ?? null;
    input.nonPajak = !!form.nonPajak; input.expired = !!form.expired;
    if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Item</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;I T E M</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari nama / barcode..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Tambah</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">
                {["ID", "Barcode", "Nama", "Group", "Vendor", "H. Beli", "H. Jual", "Min Stk"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.barcode}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{grp.find((g) => g.id === r.groupStkId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{vendor.find((v) => v.id === r.vendorId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaBeli}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual1}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.minStock}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
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
              <span className="text-[13px] font-bold">Item — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 text-[12px]">
              <div className="space-y-1">
                <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
                <F label="Barcode :"><input className="gf-3d w-[200px] bg-white px-2 py-[2px]" value={form.barcode ?? ""} onChange={(e) => set({ barcode: e.target.value })} /></F>
                <F label="Nama :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.nama} onChange={(e) => set({ nama: e.target.value })} /></F>
                <F label="Nama 2 :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.nama2 ?? ""} onChange={(e) => set({ nama2: e.target.value })} /></F>
                <F label="Group :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.groupStkId ?? ""} onChange={(e) => set({ groupStkId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{grp.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                  </select>
                </F>
                <F label="Vendor :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{vendor.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                  </select>
                </F>
                <F label="H. Beli :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaBeli ?? ""} onChange={(e) => set({ hargaBeli: e.target.value })} /></F>
                <F label="H. Jual 1 :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaJual1 ?? ""} onChange={(e) => set({ hargaJual1: e.target.value })} /></F>
                <F label="Min Stock :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.minStock ?? ""} onChange={(e) => set({ minStock: e.target.value })} /></F>
              </div>
              <div className="space-y-1">
                <F label="H. Jual 2 :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaJual2 ?? ""} onChange={(e) => set({ hargaJual2: e.target.value })} /></F>
                <F label="H. Jual 3 :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaJual3 ?? ""} onChange={(e) => set({ hargaJual3: e.target.value })} /></F>
                <F label="H. Jual 4 :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaJual4 ?? ""} onChange={(e) => set({ hargaJual4: e.target.value })} /></F>
                <F label="H. Jual 5 :"><input className="gf-3d w-[160px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaJual5 ?? ""} onChange={(e) => set({ hargaJual5: e.target.value })} /></F>
                <F label="Catatan :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} /></F>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.expired} onChange={(e) => set({ expired: e.target.checked })} /> Input Expired</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.nonPajak} onChange={(e) => set({ nonPajak: e.target.checked })} /> Non Pajak</label>
              </div>
            </div>
            {err && <div className="px-3 pb-1 text-[12px] text-red-700">{err}</div>}
            <div className="flex gap-2 border-t border-gf-border p-2">
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
  return <div className="flex items-center gap-2"><span className="w-[80px] shrink-0">{label}</span>{children}</div>;
}
