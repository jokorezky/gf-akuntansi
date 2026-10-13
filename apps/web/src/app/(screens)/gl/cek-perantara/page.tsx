"use client";


import { Pager } from "@/components/gf/Pager";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql";

type Row = { tanggal: string; debet: string; kredit: string; selisih: string };

const LIST = `query($dari:String,$sampai:String,$limit:Int,$offset:Int){ glCekPerantara(dari:$dari,sampai:$sampai,limit:$limit,offset:$offset){ total rows { tanggal debet kredit selisih } } }`;

export default function CekPerantaraPage() {
  const router = useRouter();
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const proses = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ glCekPerantara: { total: number; rows: Row[] } }>(LIST, { dari: dari || null, sampai: sampai || null, limit: 10, offset: (page - 1) * 10 });
      setRows(d.glCekPerantara.rows);
      setTotal(d.glCekPerantara.total);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }, [dari, sampai, page]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auto") === "1") void proses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[900px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Cek Perkiraan Perantara</div>
        <div className="p-2">
          <div className="mb-2 flex flex-wrap items-end gap-3 text-[12px]">
            <span>Cek Perkiraan Perantara Tanggal :</span>
            <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
            <span>-</span>
            <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            <button onClick={proses} disabled={busy} className="gf-3d bg-gf-menubar px-6 py-[3px] disabled:opacity-50">
              {busy ? "Proses..." : "&Proses"}
            </button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="max-h-[560px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {["Tanggal", "Debet", "Kredit", "Selisih"].map((h) => (
                    <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-[6px]">{r.tanggal}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.debet}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.kredit}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.selisih}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={4} className="px-2 py-3 text-center text-gf-muted">Tekan Proses untuk memuat data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gf-muted">
            <Pager page={page} total={total} onPage={setPage} className="flex-1" />
            <button onClick={() => router.push("/")} className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px]">&Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
