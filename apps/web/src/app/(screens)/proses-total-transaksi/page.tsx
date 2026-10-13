"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/gf/Pager";

type Lookup = { kode: string; judul: string; kolom: string[]; baris: string[][] };

export default function Page() {
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [data, setData] = useState<Lookup | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);

  async function proses() {
    setBusy(true);
    try {
      const d = await gql<{ totalTransaksi: Lookup }>(
        "query($a:String!, $b:String!){ totalTransaksi(dari:$a, sampai:$b){ kode judul kolom baris } }",
        { a: dari, b: sampai },
      );
      setData(d.totalTransaksi);
      setPage(1);
    } finally {
      setBusy(false);
    }
  }

  const rows = data?.baris ?? [];
  const pageRows = rows.slice((page - 1) * 10, page * 10);

  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[1000px]">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">
          Proses Laporan Total Transaksi
        </div>
        <div className="p-3">
          <div className="mb-2 text-center text-[12px] font-semibold tracking-[0.3em] text-gf-accent">
            TOTAL TRANSAKSI
          </div>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">Dari Tanggal</div>
              <input type="date" className="h-[30px] rounded-md border border-gf-border bg-white px-3 text-[12px]" value={dari} onChange={(e) => setDari(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-slate-400">Sampai Tanggal</div>
              <input type="date" className="h-[30px] rounded-md border border-gf-border bg-white px-3 text-[12px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            </div>
            <Button variant="primary" onClick={proses} disabled={busy}>
              <Play className="h-[14px] w-[14px]" />
              Proses
            </Button>
          </div>
          <div className="max-h-[460px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {(data?.kolom ?? ["Tanggal", "Jml Nota", "Nilai"]).map((h) => (
                    <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, ri) => (
                  <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50">
                    {r.map((c, ci) => (
                      <td key={ci} className={`px-3 py-[6px] ${ci > 0 ? "text-right font-mono" : ""} text-slate-700`}>{c}</td>
                    ))}
                  </tr>
                ))}
                {!data && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Pilih periode lalu tekan Proses.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={rows.length} onPage={setPage} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
