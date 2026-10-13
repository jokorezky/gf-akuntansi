"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql";

type Row = { tanggal: string; no: string; catatan: string; mu: string; debet: string; kredit: string; kurs: string; debetIdr: string; kreditIdr: string };

const MU = `query { glMuList }`;
const LIST = `query($mu:String,$dari:String,$sampai:String){ glCekKurs(mu:$mu,dari:$dari,sampai:$sampai,limit:1000){ total rows { tanggal no catatan mu debet kredit kurs debetIdr kreditIdr } } }`;

export default function CekKursJurnalPage() {
  const router = useRouter();
  const [muList, setMuList] = useState<string[]>([]);
  const [mu, setMu] = useState("---");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { gql<{ glMuList: string[] }>(MU).then((d) => setMuList(d.glMuList)).catch(() => setMuList([])); }, []);

  const proses = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ glCekKurs: { total: number; rows: Row[] } }>(LIST, { mu, dari: dari || null, sampai: sampai || null });
      setRows(d.glCekKurs.rows);
      setTotal(d.glCekKurs.total);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }, [mu, dari, sampai]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auto") === "1") void proses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Cek Kurs Jurnal</div>
        <div className="p-2">
          <div className="mb-2 flex flex-wrap items-end gap-3 text-[12px]">
            <label className="flex items-center gap-2">
              MU :
              <select className="gf-3d bg-white px-2 py-[2px]" value={mu} onChange={(e) => setMu(e.target.value)}>
                <option>---</option>
                {muList.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Tanggal :
              <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
              <span>-</span>
              <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            </label>
            <button onClick={proses} disabled={busy} className="gf-3d bg-gf-menubar px-6 py-[3px] disabled:opacity-50">
              {busy ? "Proses..." : "&Proses"}
            </button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="max-h-[560px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0">
                <tr className="bg-gf-menubar">
                  {["Tanggal", "No", "Catatan", "MU", "Debet", "Kredit", "Kurs", "Debet-IDR", "Kredit-IDR"].map((h) => (
                    <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px]">{r.tanggal}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.no}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.catatan}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.mu}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.debet}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.kredit}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.kurs}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.debetIdr}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.kreditIdr}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="px-2 py-3 text-center text-gf-muted">Tekan Proses untuk memuat data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gf-muted">
            <span>Total: {total} baris (tampil maks. 1000)</span>
            <button onClick={() => router.push("/")} className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px]">&Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
