"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  id: number; nama: string; groupNama?: string | null; kode?: string | null; tipeSatu?: number | null;
  sisa?: string | null; hargaJual1?: string | null; hargaJual2?: string | null; hargaJual3?: string | null;
  hargaJual4?: string | null; hargaJual5?: string | null;
};

const LIST = `query($q:String){ sisaStockList(q:$q){ total rows { id nama groupNama kode tipeSatu sisa hargaJual1 hargaJual2 hargaJual3 hargaJual4 hargaJual5 } } }`;

export default function SisaStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ sisaStockList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.sisaStockList.rows); setTotal(d.sisaStockList.total);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Sisa Stock</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;S I S A&nbsp;&nbsp;S T O C K</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari nama / barcode..." value={q} onChange={(e) => setQ(e.target.value)} />
            <span className="text-[11px] text-gf-muted">(read-only)</span>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">
                {["Group", "Kode", "Nama", "Tipe Satuan", "Sisa", "H. Jual #1", "H. Jual #2", "H. Jual #3", "H. Jual #4", "H. Jual #5"].map((h) => (
                  <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px]">{r.groupNama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.kode}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tipeSatu}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.sisa}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual1}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual2}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual3}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual4}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual5}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={10} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>
    </div>
  );
}
