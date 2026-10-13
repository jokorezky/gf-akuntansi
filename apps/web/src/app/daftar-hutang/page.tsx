"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; no?: string | null; tanggal?: string | null; vendorNama?: string | null; total?: string | null; dibayar?: string | null; retur?: string | null; sisa?: string | null };

const LIST = `query($q:String){ daftarHutangList(q:$q){ total rows { id no tanggal vendorNama total dibayar retur sisa } } }`;

export default function DaftarHutangPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [only, setOnly] = useState(true);

  const load = useCallback(async () => {
    const d = await gql<{ daftarHutangList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.daftarHutangList.rows); setTotal(d.daftarHutangList.total);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const shown = only ? rows.filter((r) => Number(r.sisa ?? 0) > 0.0001) : rows;
  const sumSisa = shown.reduce((s, r) => s + Number(r.sisa ?? 0), 0);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Daftar Hutang</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">D A F T A R&nbsp;&nbsp;H U T A N G</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / vendor..." value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Hanya belum lunas</label>
            <span className="text-[11px] text-gf-muted">(read-only)</span>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["ID", "No", "Tanggal", "Vendor", "Total", "Dibayar", "Retur", "Sisa"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.no}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.vendorNama}</td>
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
          <div className="mt-1 flex justify-between text-[11px] text-gf-muted"><span>Total nota: {total}</span><span>Total sisa hutang: <b className="font-mono">{sumSisa.toFixed(2)}</b></span></div>
        </div>
      </div>
    </div>
  );
}
