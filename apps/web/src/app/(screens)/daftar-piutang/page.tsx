"use client";



import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; no?: string | null; tanggal?: string | null; pelangNama?: string | null; total?: string | null; dibayar?: string | null; retur?: string | null; sisa?: string | null };

const LIST = `query($q:String, $limit:Int, $offset:Int){ daftarPiutangList(q:$q, limit:$limit, offset:$offset){ total rows { id no tanggal pelangNama total dibayar retur sisa } } }`;
export default function DaftarPiutangPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [only, setOnly] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ daftarPiutangList: { total: number; rows: Row[] } }>(LIST, { q, limit: 15, offset: (page - 1) * 15 });
    setRows(d.daftarPiutangList.rows); setTotal(d.daftarPiutangList.total);
  }, [q, page]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const shown = only ? rows.filter((r) => Number(r.sisa ?? 0) > 0.0001) : rows;
  const sumSisa = shown.reduce((s, r) => s + Number(r.sisa ?? 0), 0);

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Daftar Piutang</div>
        <div className="p-2">
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button onClick={() => setMsg("Menu — gunakan menu utama")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <Button onClick={() => { window.location.href = "/laporan"; }}><FileSpreadsheet className="h-[14px] w-[14px] text-slate-600" /></Button>
            <button onClick={() => { window.location.href = "/penerimaan-piutang"; }} className="gf-3d bg-gf-menubar px-3 py-[10px] text-[11px] font-bold">Masuk Daftar Tagihan</button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-3 py-[10px] text-[11px]">Tutup</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">D A F T A R&nbsp;&nbsp;P I U T A N G</span>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button onClick={() => { setMsg("Proses"); void load(); }} className="gf-3d bg-gf-menubar px-4 py-[3px] text-[12px] font-bold">Proses</button>
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Yang Belum Ada Pelunasan</label>
            <label className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={!only} onChange={(e) => setOnly(!e.target.checked)} /> Yang Sudah Ada Pelunasan</label>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-2 text-[11px] text-gf-muted">{msg}</div>}
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["ID", "No", "Tanggal", "Pelanggan", "Total", "Diterima", "Retur", "Sisa"].map((h) => <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.id}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.no}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.tanggal}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.pelangNama}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.total}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.dibayar}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.retur}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono font-bold">{r.sisa}</td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-gf-muted"><span>Total nota: {total}</span><span>Total sisa piutang: <b className="font-mono">{sumSisa.toFixed(2)}</b></span></div>
        </div>
      </div>
    </div>
  );
}
