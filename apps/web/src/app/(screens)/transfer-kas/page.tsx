"use client";



import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Hdr = { id: number; no?: string | null; tanggal?: string | null; divisiId?: number | null; catatan?: string | null; total?: string | null };
type Ref = { id: number; nama: string };

const LIST = `query($q:String, $limit:Int, $offset:Int){ kasKeluarList(q:$q, limit:$limit, offset:$offset){ total rows { id no tanggal catatan total } } }`;
const CREATE = `mutation($input:KasKeluarInput!){ createKasKeluar(input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteKasKeluar(id:$id) }`;
const REFS = `{ perkiraanRefList { id nama } divisiRefList { id nama } }`;

export default function TransferKasPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [akun, setAkun] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [dari, setDari] = useState<number | null>(null);
  const [ke, setKe] = useState<number | null>(null);
  const [nilai, setNilai] = useState("");
  const [biaya, setBiaya] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ kasKeluarList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.kasKeluarList.rows); setTotal(d.kasKeluarList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ perkiraanRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setAkun(d.perkiraanRefList); setDivisi(d.divisiRefList); }).catch(() => {});
  }, [load]);

  async function onTambah() { setErr(""); setForm({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), divisiId: null, catatan: "" }); setDari(null); setKe(null); setNilai(""); setBiaya(""); }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus transfer id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!dari || !ke) return setErr("Akun Dari dan Ke wajib dipilih.");
    if (!nilai || Number(nilai) <= 0) return setErr("Nilai wajib > 0.");
    setErr("");
    const lines = [
      { perkirId: dari, nilai, kredit: true },
      { perkirId: ke, nilai, kredit: false },
    ];
    if (biaya && Number(biaya) > 0) lines.push({ perkirId: ke, nilai: biaya, kredit: false });
    const input = { no: form.no || null, tanggal: form.tanggal || null, divisiId: form.divisiId ?? null, catatan: form.catatan || null, lines };
    await gql(CREATE, { input });
    setForm(null); setMsg("Transfer tersimpan."); await load();
  }

  const setH = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Transfer Kas</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-semibold tracking-[0.35em] text-gf-accent">T R A N S F E R&nbsp;&nbsp;K A S</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onTambah}>Transfer Baru</button>
            <button className="gf-3d bg-gf-panel px-3 py-[3px] text-[12px] hover:bg-gf-hl hover:text-white" onClick={onHapus}>Hapus</button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["ID", "No", "Tanggal", "Catatan", "Nilai"].map((h) => <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-slate-50"}`}>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.id}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.no}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.tanggal}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.catatan}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.total}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1250px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
          <div className="w-[820px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Transfer Kas — Transfer Baru</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="space-y-1 p-3 text-[12px]">
              <F label="No Bukti :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => setH({ no: e.target.value })} /></F>
              <F label="Tanggal :"><input type="date" className="gf-3d w-[180px] bg-white px-2 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => setH({ tanggal: e.target.value })} /></F>
              <F label="Divisi :">
                <select className="gf-3d w-full bg-white px-2 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => setH({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
              </F>
              <div className="mt-2 border border-gf-border p-2">
                <div className="mb-1 font-bold">Dari rekening/pos perkiraan (KREDIT)</div>
                <F label="#Acc :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={dari ?? ""} onChange={(e) => setDari(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">--</option>{akun.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                  </select>
                </F>
                <F label="Nilai :"><input className="gf-3d w-[200px] bg-white px-2 py-[2px] text-right font-mono" value={nilai} onChange={(e) => setNilai(e.target.value)} /></F>
              </div>
              <div className="mt-2 border border-gf-border p-2">
                <div className="mb-1 font-bold">Ke rekening/pos perkiraan (DEBET)</div>
                <F label="#Acc :">
                  <select className="gf-3d w-full bg-white px-2 py-[2px]" value={ke ?? ""} onChange={(e) => setKe(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">--</option>{akun.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                  </select>
                </F>
                <F label="#Biaya :"><input className="gf-3d w-[200px] bg-white px-2 py-[2px] text-right font-mono" value={biaya} onChange={(e) => setBiaya(e.target.value)} /></F>
              </div>
              <F label="Catatan :"><input className="gf-3d w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => setH({ catatan: e.target.value })} /></F>
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
