"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { stockId?: number | null; stockNama?: string | null; expired?: string | null; jumlah?: string | null; gudang?: number | null };

const LIST = `query($q:String){ barangExpiredList(q:$q){ total rows { stockId stockNama expired jumlah gudang } } }`;

export default function BarangExpiredPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ barangExpiredList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.barangExpiredList.rows); setTotal(d.barangExpiredList.total);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1100px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Barang Expired</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;E X P I R E D</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari nama barang..." value={q} onChange={(e) => setQ(e.target.value)} />
            <span className="text-[11px] text-gf-muted">(read-only)</span>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["ED", "Barang", "Jumlah", "Gudang", "Status"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px]">{r.expired}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.stockNama}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.jumlah}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.gudang}</td>
                    <td className={`border border-gf-border px-2 py-[2px] ${(r.expired ?? "") < today ? "text-red-700 font-bold" : "text-green-700"}`}>{(r.expired ?? "") < today ? "KEDALUWARSA" : "masih berlaku"}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>
    </div>
  );
}
