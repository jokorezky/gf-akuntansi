"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Perk = { id: number; nama: string };
type Row = {
  id: number; tanggal?: string | null; no?: string | null; catatan?: string | null; noTrans?: string | null;
  mu?: number | null; debet?: string | null; kredit?: string | null; saldo?: string | null; kurs?: string | null;
  debetIdr?: string | null; kreditIdr?: string | null; saldoIdr?: string | null; note?: string | null; date?: string | null;
  vendorNama?: string | null; pelangganNama?: string | null; jenis?: number | null; divisiId?: number | null;
};
type Mutasi = { akunNama?: string | null; akunKode?: string | null; saldoAwal?: string | null; totDebet?: string | null; totKredit?: string | null; saldoAkhir?: string | null; saldoTarikKurs?: string | null; rows: Row[] };

const Q = `query($id:Int!,$dari:String,$sampai:String,$urut:Boolean){ bukuBesarMutasi(perkirId:$id, dari:$dari, sampai:$sampai, urutTglInput:$urut){ akunNama akunKode saldoAwal totDebet totKredit saldoAkhir saldoTarikKurs rows { id tanggal no catatan noTrans mu debet kredit saldo kurs debetIdr kreditIdr saldoIdr note date vendorNama pelangganNama jenis divisiId } } }`;
const PERKS = `{ perkiraanRefList { id nama } }`;
const JENIS: Record<number, string> = { 1: "Jurnal Umum", 2: "Memorial", 3: "Penyesuaian", 4: "Penutup" };

export default function BukuBesarPage() {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [perkirId, setPerkirId] = useState<number | null>(null);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [tanpaSaldo, setTanpaSaldo] = useState(false);
  const [urutInput, setUrutInput] = useState(false);
  const [data, setData] = useState<Mutasi | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gql<{ perkiraanRefList: Perk[] }>(PERKS).then((d) => setPerks(d.perkiraanRefList)).catch(() => undefined);
  }, []);

  const proses = useCallback(async () => {
    if (perkirId == null) return setMsg("Pilih #Acc dulu.");
    setErr(""); setMsg(""); setLoading(true);
    try {
      const d = await gql<{ bukuBesarMutasi: Mutasi | null }>(Q, { id: perkirId, dari: dari || null, sampai: sampai || null, urut: urutInput });
      setData(d.bukuBesarMutasi);
      setMsg(d.bukuBesarMutasi ? `${d.bukuBesarMutasi.rows.length} mutasi — ${d.bukuBesarMutasi.akunKode} ${d.bukuBesarMutasi.akunNama}` : "Akun tidak ditemukan.");
    } catch (e) { setErr(String((e as Error).message ?? e)); }
    finally { setLoading(false); }
  }, [perkirId, dari, sampai, urutInput]);

  const td = "border border-gf-border px-1 py-[1px]";
  const saldoCell = (r: Row) => (tanpaSaldo ? "0.00" : r.saldo);

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1280px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Buku Besar</div>
        <div className="p-2">
          <div className="mb-1 grid grid-cols-[70px_1fr_330px] items-center gap-x-2 gap-y-1 text-[12px]">
            <span>#Acc :</span>
            <select className="gf-3d w-[520px] bg-white px-1 py-[2px]" value={perkirId ?? ""} onChange={(e) => setPerkirId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">-- pilih perkiraan --</option>
              {perks.map((p) => <option key={p.id} value={p.id}>{p.nama} ({p.id})</option>)}
            </select>
            <div className="flex flex-col gap-[3px]">
              <button onClick={() => setTanpaSaldo(!tanpaSaldo)} className={`gf-3d w-[220px] px-2 py-[2px] text-[11px] ${tanpaSaldo ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Tanpa Hitung Saldo</button>
              <button onClick={() => setUrutInput(!urutInput)} className={`gf-3d w-[220px] px-2 py-[2px] text-[11px] ${urutInput ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>+urut berdasarkan tgl input</button>
            </div>
            <span>Tanggal :</span>
            <div className="flex items-center gap-1">
              <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
              <span>-</span>
              <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
              <button className="gf-3d w-[200px] bg-gf-menubar px-2 py-[2px] text-[11px]" onClick={() => setMsg("Double Klik Tampil Jurnal — double-click baris grid")}>Double Klik Tampil Jurnal</button>
            </div>
            <span>Saldo Awal :</span>
            <div className="flex items-center gap-2">
              <span className="gf-3d bg-[#eef7d6] px-3 py-[2px] font-mono text-[12px]">{data?.saldoAwal ?? "0.00"}</span>
              <span className="text-[10px] text-gf-muted">(dari s_perkir.sal_awal)</span>
            </div>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}

          <div className="mb-1 grid grid-cols-4 gap-2 text-[12px]">
            <div className="border border-gf-border bg-[#f4f4f4] px-2 py-1">Total Debet <b className="float-right font-mono">{data?.totDebet ?? "0.00"}</b></div>
            <div className="border border-gf-border bg-[#f4f4f4] px-2 py-1">Total Kredit <b className="float-right font-mono">{data?.totKredit ?? "0.00"}</b></div>
            <div className="border border-gf-border bg-[#f4f4f4] px-2 py-1">Saldo Akhir <b className="float-right font-mono">{data?.saldoAkhir ?? "0.00"}</b></div>
            <div className="border border-gf-border bg-[#f4f4f4] px-2 py-1">Setelah Tarik Kurs <b className="float-right font-mono">{data?.saldoTarikKurs ?? "0.00"}</b></div>
          </div>
          <div className="mb-1 flex gap-4 text-[10px] text-gf-muted">
            <span>IDR :</span><span className="ml-[240px]">IDR :</span>
          </div>

          <div className="max-h-[330px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["Tanggal", "No", "Catatan", "No-Trans", "MU", "Debet", "Kredit", "Saldo", "Kurs", "Debet-IDR", "Kredit-IDR", "Saldo-IDR", "Note", "Date", "Vendor", "Pelanggan", "Jenis", "Divisi", "ID"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(data?.rows ?? []).map((r) => (
                  <tr key={`${r.id}-${r.tanggal}-${r.saldo}`} className="hover:bg-slate-50" onDoubleClick={() => setMsg(`Tampil Jurnal — jurnal id ${r.id}${r.noTrans ? ` (No-Trans: ${r.noTrans})` : ""}`)}>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.noTrans}</td>
                    <td className={td}>IDR</td>
                    <td className={`${td} text-right font-mono`}>{r.debet}</td>
                    <td className={`${td} text-right font-mono`}>{r.kredit}</td>
                    <td className={`${td} text-right font-mono font-bold`}>{saldoCell(r)}</td>
                    <td className={td}>{r.kurs}</td>
                    <td className={`${td} text-right font-mono`}>{r.debetIdr}</td>
                    <td className={`${td} text-right font-mono`}>{r.kreditIdr}</td>
                    <td className={`${td} text-right font-mono`}>{tanpaSaldo ? "0.00" : r.saldoIdr}</td>
                    <td className={td}>{r.note}</td>
                    <td className={td}>{r.date}</td>
                    <td className={td}>{r.vendorNama}</td>
                    <td className={td}>{r.pelangganNama}</td>
                    <td className={td}>{r.jenis != null ? (JENIS[r.jenis] ?? r.jenis) : ""}</td>
                    <td className={td}>{r.divisiId ?? ""}</td>
                    <td className={td}>{r.id}</td>
                  </tr>
                ))}
                {(data?.rows ?? []).length === 0 && <tr><td colSpan={19} className="px-2 py-3 text-center text-gf-muted">{loading ? "Memproses..." : "Pilih #Acc + Proses untuk menampilkan mutasi."}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Cetak Setup</button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Cetak</button>
            <button onClick={proses} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px] font-bold">Proses</button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
