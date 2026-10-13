"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql";

type Row = { tanggal: string; debet: string; kredit: string; selisih: string };

const LIST = `query($dari:String,$sampai:String){ glCekPerantara(dari:$dari,sampai:$sampai,limit:1000){ total rows { tanggal debet kredit selisih } } }`;

export default function CekPerantaraPage() {
  const router = useRouter();
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const proses = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ glCekPerantara: { total: number; rows: Row[] } }>(LIST, { dari: dari || null, sampai: sampai || null });
      setRows(d.glCekPerantara.rows);
      setTotal(d.glCekPerantara.total);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }, [dari, sampai]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auto") === "1") void proses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[900px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Cek Perkiraan Perantara</div>
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
          <div className="max-h-[560px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0">
                <tr className="bg-gf-menubar">
                  {["Tanggal", "Debet", "Kredit", "Selisih"].map((h) => (
                    <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal}</td>
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
            <span>Total: {total} tanggal</span>
            <button onClick={() => router.push("/")} className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px]">&Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
