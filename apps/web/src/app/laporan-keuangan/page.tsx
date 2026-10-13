"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = { id: number; nama: string; kode?: string | null; golongan?: number | null; salAwal?: string | null; debet?: string | null; kredit?: string | null; saldo?: string | null };

const LIST = `query($dari:String,$sampai:String){ laporanKeuanganList(dari:$dari, sampai:$sampai) { id nama kode golongan salAwal debet kredit saldo } }`;

const CLASSES: { digit: string; label: string; sign: 1 | -1 }[] = [
  { digit: "1", label: "AKTIVA", sign: 1 },
  { digit: "2", label: "KEWAJIBAN", sign: -1 },
  { digit: "3", label: "MODAL", sign: -1 },
  { digit: "4", label: "PENDAPATAN", sign: -1 },
  { digit: "5", label: "BEBAN / HPP", sign: 1 },
];

export default function LaporanKeuanganPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ laporanKeuanganList: Row[] }>(LIST, { dari: dari || null, sampai: sampai || null });
    setRows(d.laporanKeuanganList);
  }, [dari, sampai]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const groups = useMemo(() => {
    const g: Record<string, { rows: Row[]; total: number }> = {};
    for (const c of CLASSES) g[c.digit] = { rows: [], total: 0 };
    for (const r of rows) {
      const d = (r.kode ?? "").charAt(0);
      if (!g[d]) continue;
      const saldo = Number(r.saldo ?? 0);
      g[d].rows.push(r);
      g[d].total += saldo;
    }
    return g;
  }, [rows]);

  const laba = (groups["4"]?.total ?? 0) * -1 - (groups["5"]?.total ?? 0);
  const totalAktiva = groups["1"]?.total ?? 0;
  const totalPasiva = -((groups["2"]?.total ?? 0) + (groups["3"]?.total ?? 0)) + laba;

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1000px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Laporan Keuangan</div>
        <div className="p-2">
          <div className="mb-1 text-center text-[12px] font-bold tracking-widest text-gf-accent">L A P O R A N&nbsp;&nbsp;K E U A N G A N</div>
          <div className="mb-2 flex items-center gap-2 text-[12px]">
            <span>Tanggal :</span>
            <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
            <span>-</span>
            <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            <button className="gf-3d bg-gf-menubar px-4 py-[2px] text-[12px] font-bold" onClick={() => { void load(); }}>Proses</button>
            <button className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]" onClick={() => { setDari(""); setSampai(""); }}>Reset</button>
            <span className="text-[10px] text-gf-muted">Rumus: saldo = sal_awal + mutasi dalam rentang (s_perkir.sal_awal + s_jurnex via s_jurnal non-hapus).</span>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {CLASSES.map((c) => (
            <div key={c.digit} className="mb-3">
              <div className="bg-gf-menubar border border-gf-border px-2 py-1 text-[12px] font-bold">{c.label}</div>
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {groups[c.digit]?.rows.filter((r) => Number(r.saldo ?? 0) !== 0).map((r) => (
                    <tr key={r.id} className="hover:bg-[#e8eef7]">
                      <td className="border border-gf-border px-2 py-[2px] w-[110px]">{r.kode}</td>
                      <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                      <td className="border border-gf-border px-2 py-[2px] text-right font-mono w-[200px]">{r.saldo}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#f0f0f0] font-bold">
                    <td className="border border-gf-border px-2 py-[2px]" colSpan={2}>Subtotal {c.label}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{groups[c.digit]?.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <div className="mt-3 border border-gf-border p-2 text-[12px]">
            <div className="mb-1 font-bold">Ringkasan</div>
            <div className="flex justify-between"><span>Laba / (Rugi)</span><b className="font-mono">{laba.toFixed(2)}</b></div>
            <div className="flex justify-between"><span>Total Aktiva</span><b className="font-mono">{totalAktiva.toFixed(2)}</b></div>
            <div className="flex justify-between"><span>Total Pasiva (Kewajiban + Modal + Laba)</span><b className="font-mono">{totalPasiva.toFixed(2)}</b></div>
            <div className={`mt-1 font-bold ${Math.abs(totalAktiva - totalPasiva) < 1 ? "text-green-700" : "text-red-700"}`}>
              {Math.abs(totalAktiva - totalPasiva) < 1 ? "Neraca Balance" : "Neraca Tidak Balance (selisih " + (totalAktiva - totalPasiva).toFixed(2) + ")"}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">(read-only — dari saldo akun & jurnal)</div>
        </div>
      </div>
    </div>
  );
}
