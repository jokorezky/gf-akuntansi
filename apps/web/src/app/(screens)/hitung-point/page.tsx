"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator } from "lucide-react";
import { toast } from "sonner";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/gf/Pager";

type Lookup = { kode: string; judul: string; kolom: string[]; baris: string[][] };

export default function Page() {
  const [data, setData] = useState<Lookup | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const d = await gql<{ pointInfo: Lookup }>("{ pointInfo { kode judul kolom baris } }");
      setData(d.pointInfo);
      setPage(1);
      toast.success(`Proses hitung point selesai — ${d.pointInfo.baris.length} pelanggan.`);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const rows = data?.baris ?? [];
  const pageRows = rows.slice((page - 1) * 10, page * 10);

  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[1000px]">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">
          Proses Hitung Point
        </div>
        <div className="p-3">
          <div className="mb-2 text-center text-[12px] font-semibold tracking-[0.3em] text-gf-accent">HITUNG POINT</div>
          <div className="mb-3 flex items-center gap-2">
            <Button variant="primary" onClick={run} disabled={busy}>
              <Calculator className="h-[14px] w-[14px]" />
              Proses Hitung Point
            </Button>
            <span className="text-[11px] text-slate-400">{data?.judul ?? ""}</span>
          </div>
          <div className="max-h-[460px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {(data?.kolom ?? ["Memuat…"]).map((h) => (
                    <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, ri) => (
                  <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50">
                    {r.map((c, ci) => (
                      <td key={ci} className={`px-3 py-[6px] ${ci > 0 ? "text-right font-mono" : "font-medium"} text-slate-700`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={rows.length} onPage={setPage} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
