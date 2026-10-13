"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; nama: string; debet?: string | null; kredit?: string | null; saldo?: string | null };

const LIST = `query($q:String){ bukuBesarList(q:$q){ total rows { id nama debet kredit saldo } } }`;

export default function BukuBesarPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ bukuBesarList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.bukuBesarList.rows); setTotal(d.bukuBesarList.total);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const sumD = rows.reduce((s, r) => s + Number(r.debet ?? 0), 0);
  const sumK = rows.reduce((s, r) => s + Number(r.kredit ?? 0), 0);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Buku Besar</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">B U K U&nbsp;&nbsp;B E S A R</div>
          <div className="mb-2 flex items-center gap-2">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari akun..." value={q} onChange={(e) => setQ(e.target.value)} />
            <span className="text-[11px] text-gf-muted">(read-only)</span>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">{["#Acc", "Nama Akun", "Debet", "Kredit", "Saldo"].map((h) => <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.debet}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.kredit}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono font-bold">{r.saldo}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-gf-muted">
            <span>Total akun: {total}</span>
            <span>Σ Debet: <b className="font-mono">{sumD.toFixed(2)}</b> · Σ Kredit: <b className="font-mono">{sumK.toFixed(2)}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
