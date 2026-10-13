"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql";

type Row = { no: number; kode: string; nama: string; mu: string; saldo: string };

const LIST = `query($kelas:String,$golongan:String,$sampai:String){ glSaldoAkhir(kelas:$kelas,golongan:$golongan,sampai:$sampai,limit:1000){ total rows { no kode nama mu saldo } } }`;

const KELAS = ["AKTIVA", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "HARGA POKOK PENJUALAN", "BIAYA/BEBAN", "PENDAPATAN LAINNYA", "BIAYA/BEBAN LAINNYA"];
const GOLONGAN = ["---", "Golongan Kas/Bank", "Golongan Piutang/Hutang", "Golongan Aktiva Tetap", "Golongan Lainnya"];

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SaldoAkhirPage() {
  const router = useRouter();
  const [dari, setDari] = useState(firstOfMonth());
  const [sampai, setSampai] = useState(today());
  const [kelas, setKelas] = useState("AKTIVA");
  const [golongan, setGolongan] = useState("---");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [setup, setSetup] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ glSaldoAkhir: { total: number; rows: Row[] } }>(LIST, { kelas, golongan, sampai: sampai || null });
      setRows(d.glSaldoAkhir.rows);
      setTotal(d.glSaldoAkhir.total);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }, [kelas, golongan, sampai]);

  useEffect(() => { load(); }, [load]);

  const tglTampil = useMemo(() => {
    if (!sampai) return "-";
    const [y, m, d] = sampai.split("-");
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nop", "Des"];
    return `${Number(d)} ${bulan[Number(m) - 1]} ${y}`;
  }, [sampai]);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1000px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Saldo Akhir Perkiraan</div>
        <div className="p-2">
          <div className="mb-2 flex flex-wrap items-end gap-3 text-[12px]">
            <span>Periode :</span>
            <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
            <span>-</span>
            <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            <select className="gf-3d bg-white px-2 py-[2px]" value={kelas} onChange={(e) => setKelas(e.target.value)}>
              {KELAS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <select className="gf-3d bg-white px-2 py-[2px]" value={golongan} onChange={(e) => setGolongan(e.target.value)}>
              {GOLONGAN.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          <div className="text-[12px] font-bold">MONI COSMETIC SUPERMARKET</div>
          <div className="mb-1 text-[11px] text-gf-muted">Saldo Akhir Perkiraan Per : {tglTampil}</div>
          <div className="max-h-[560px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0">
                <tr className="bg-gf-menubar">
                  {["NO", "KODE", "PERKIRAAN", "MU", "SALDO"].map((h) => (
                    <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.kode + r.no} className="hover:bg-[#e8eef7]">
                    <td className="border border-gf-border px-2 py-[2px] text-right">{r.no}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.kode}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.mu}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.saldo}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-center text-gf-muted">{busy ? "Memuat..." : "Belum ada data."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total} akun (leaf)</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setSetup(true)} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[12px]">Cetak Set&up</button>
            <button onClick={() => window.print()} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[12px]">&Cetak</button>
            <button onClick={() => router.push("/")} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[12px]">&Tutup</button>
          </div>
        </div>
      </div>

      {setup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30" onClick={() => setSetup(false)}>
          <div className="w-[320px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 border-b border-gf-border pb-1 text-[13px] font-bold">Report Set</div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-[110px]">Number Copies :</span>
              <input className="gf-3d w-[80px] bg-white px-2 py-[2px]" defaultValue="1" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="w-[110px]">Print To :</span>
              <select className="gf-3d flex-1 bg-white px-1 py-[2px]">
                <option>Default Printer</option>
                <option>Microsoft Print to PDF</option>
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setSetup(false)} className="gf-3d flex-1 bg-gf-menubar px-[2px] py-[2px] text-[12px]">&Ok</button>
              <button onClick={() => setSetup(false)} className="gf-3d flex-1 bg-gf-menubar px-[2px] py-[2px] text-[12px]">&Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
