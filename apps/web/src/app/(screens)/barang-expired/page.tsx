"use client";


import { Pager } from "@/components/gf/Pager";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { stockId?: number | null; stockNama?: string | null; expired?: string | null; jumlah?: string | null; gudang?: number | null };

const LIST = `query($q:String, $limit:Int, $offset:Int){ barangExpiredList(q:$q, limit:$limit, offset:$offset){ total rows { stockId stockNama expired jumlah gudang } } }`;

export default function BarangExpiredPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ barangExpiredList: { total: number; rows: Row[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.barangExpiredList.rows); setTotal(d.barangExpiredList.total);
  }, [q, page]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1100px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Barang Expired</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-semibold tracking-[0.35em] text-gf-accent">B A R A N G&nbsp;&nbsp;E X P I R E D</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <span className="text-[11px] text-gf-muted">(read-only)</span>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["ED", "Barang", "Jumlah", "Gudang", "Status"].map((h) => <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.expired}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.stockNama}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.jumlah}</td>
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.gudang}</td>
                    <td className={`border border-gf-border px-2 py-[2px] ${(r.expired ?? "") < today ? "text-red-700 font-bold" : "text-green-700"}`}>{(r.expired ?? "") < today ? "KEDALUWARSA" : "masih berlaku"}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
