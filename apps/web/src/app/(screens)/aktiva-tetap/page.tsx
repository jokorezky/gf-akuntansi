"use client";



import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; nama: string; kode?: string | null; beliDari?: string | null; jualKpd?: string | null; outKet?: string | null; tglBeli?: string | null; hargaBeli?: string | null; tglSusut?: string | null; mtdSusut?: number | null; nilSusut?: string | null; usiaSusut?: number | null; divisiId?: number | null; perkirId1?: number | null; perkirId2?: number | null; tglJual?: string | null; tglOut?: string | null; catatan?: string | null };
type Ref = { id: number; nama: string };

const FIELDS = `id nama kode beliDari jualKpd outKet tglBeli hargaBeli tglSusut mtdSusut nilSusut usiaSusut divisiId perkirId1 perkirId2 tglJual tglOut catatan`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ aktivaTetapList(q:$q, limit:$limit, offset:$offset){ total rows { ${FIELDS} } } }`;
const BYID = `query($id:Int!){ aktivaTetapById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:AktivaTetapInput!){ createAktivaTetap(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:AktivaTetapInput!){ updateAktivaTetap(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteAktivaTetap(id:$id) }`;
const REFS = `{ perkiraanRefList { id nama } divisiRefList { id nama } }`;

const empty = (): Row => ({ id: 0, nama: "", kode: "", beliDari: "", jualKpd: "", outKet: "", tglBeli: new Date().toISOString().slice(0, 10), hargaBeli: "", tglSusut: "", mtdSusut: 1, nilSusut: "", usiaSusut: 5, divisiId: null, perkirId1: null, perkirId2: null, tglJual: "", tglOut: "", catatan: "" });
const METODE = ["Garis Lurus", "Saldo Menurun", "Jumlah Angka Tahun"];

export default function AktivaTetapPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [akun, setAkun] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ aktivaTetapList: { total: number; rows: Row[] } }>(LIST, { q, limit: 15, offset: (page - 1) * 15 });
    setRows(d.aktivaTetapList.rows); setTotal(d.aktivaTetapList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ perkiraanRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setAkun(d.perkiraanRefList); setDivisi(d.divisiRefList); }).catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ aktivaTetapById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.aktivaTetapById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus aktiva tetap id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.nama.trim()) return setErr("Nama A/T wajib diisi.");
    setErr("");
    const input: Record<string, unknown> = { nama: form.nama.trim() };
    for (const k of ["kode", "beliDari", "jualKpd", "outKet", "tglBeli", "hargaBeli", "tglSusut", "nilSusut", "tglJual", "tglOut", "catatan"] as const) input[k] = (form as Record<string, unknown>)[k] || null;
    for (const k of ["mtdSusut", "usiaSusut", "divisiId", "perkirId1", "perkirId2"] as const) input[k] = (form as Record<string, unknown>)[k] ?? null;
    if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Aktiva Tetap</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-semibold tracking-[0.35em] text-gf-accent">A K T I V A&nbsp;&nbsp;T E T A P</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Tambah</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onKoreksi}>Koreksi</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["ID", "Kode", "Nama A/T", "Beli Dari", "Tgl Beli", "Harga Beli", "Mulai Susut", "% Susut", "Usia (thn)"].map((h) => <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-slate-50"}`}>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.id}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.kode}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.nama}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.beliDari}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.tglBeli}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaBeli}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.tglSusut}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.nilSusut}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.usiaSusut}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1250px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[900px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Aktiva Tetap — {mode === "create" ? "Tambah" : "Koreksi"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 text-[12px]">
              <div className="space-y-1">
                <F label="ID :"><input className="gf-3d w-[110px] bg-[#eef7d6] px-2 py-[2px]" value={mode === "create" ? "(auto)" : form.id} readOnly /></F>
                <F label="Kode A/T :"><input className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={form.kode ?? ""} onChange={(e) => set({ kode: e.target.value })} /></F>
                <F label="Nama A/T :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.nama} onChange={(e) => set({ nama: e.target.value })} /></F>
                <F label="Beli Dari :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.beliDari ?? ""} onChange={(e) => set({ beliDari: e.target.value })} /></F>
                <F label="Tgl Beli :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tglBeli ?? ""} onChange={(e) => set({ tglBeli: e.target.value })} /></F>
                <F label="Harga Beli :"><input className="gf-3d w-[180px] bg-white px-2 py-[2px] text-right font-mono" value={form.hargaBeli ?? ""} onChange={(e) => set({ hargaBeli: e.target.value })} /></F>
                <F label="Mulai Susut :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tglSusut ?? ""} onChange={(e) => set({ tglSusut: e.target.value })} /></F>
                <F label="Metode Susut :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.mtdSusut ?? 1} onChange={(e) => set({ mtdSusut: Number(e.target.value) })}>
                    {METODE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </F>
                <F label="% Susut :"><input className="gf-3d w-[120px] bg-white px-2 py-[2px] text-right font-mono" value={form.nilSusut ?? ""} onChange={(e) => set({ nilSusut: e.target.value })} /></F>
                <F label="Usia Susut :"><input type="number" className="gf-3d w-[100px] bg-white px-2 py-[2px]" value={form.usiaSusut ?? ""} onChange={(e) => set({ usiaSusut: e.target.value ? Number(e.target.value) : null })} /></F>
              </div>
              <div className="space-y-1">
                <F label="Divisi :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </F>
                <F label="#Acc Aktiva :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.perkirId1 ?? ""} onChange={(e) => set({ perkirId1: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{akun.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                  </select>
                </F>
                <F label="#Acc Susut :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.perkirId2 ?? ""} onChange={(e) => set({ perkirId2: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{akun.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                  </select>
                </F>
                <F label="Jual Kepada :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.jualKpd ?? ""} onChange={(e) => set({ jualKpd: e.target.value })} /></F>
                <F label="Alasan Out :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.outKet ?? ""} onChange={(e) => set({ outKet: e.target.value })} /></F>
                <F label="Tgl Jual :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tglJual ?? ""} onChange={(e) => set({ tglJual: e.target.value })} /></F>
                <F label="Tgl Out :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tglOut ?? ""} onChange={(e) => set({ tglOut: e.target.value })} /></F>
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
  return <div className="flex items-center gap-2"><span className="w-[100px] shrink-0">{label}</span>{children}</div>;
}
