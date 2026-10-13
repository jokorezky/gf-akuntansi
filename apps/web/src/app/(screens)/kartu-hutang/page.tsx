"use client";


import { Pager } from "@/components/gf/Pager";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Row = { vendorNama?: string | null; tanggal?: string | null; jenis?: string | null; no?: string | null; nilai?: string | null; debet?: string | null; kredit?: string | null; saldo?: string | null };

const LIST = `query($vendorId:Int,$dari:String,$sampai:String,$limit:Int,$offset:Int){ kartuHutangList(vendorId:$vendorId, dari:$dari, sampai:$sampai, limit:$limit, offset:$offset){ total rows { vendorNama tanggal jenis no nilai debet kredit saldo } } }`;
const REFS = `{ vendorRefList { id nama } }`;

const rp = (v: unknown): string => Number(v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function KartuHutangPage() {
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gql<{ vendorRefList: Ref[] }>(REFS).then((d) => setVendors(d.vendorRefList)).catch(() => undefined);
  }, []);

  const proses = useCallback(async () => {
    setErr(""); setMsg(""); setLoading(true);
    try {
      const d = await gql<{ kartuHutangList: { total: number; rows: Row[] } }>(LIST, { vendorId: vendorId ?? null, dari: dari || null, sampai: sampai || null, limit: 15, offset: (page - 1) * 15 });
      setRows(d.kartuHutangList.rows); setTotal(d.kartuHutangList.total);
      setMsg(`${d.kartuHutangList.total} mutasi${vendorId ? ` — ${vendors.find((v) => v.id === vendorId)?.nama ?? `vendor #${vendorId}`}` : " (semua vendor)"}.`);
    } catch (e) { setErr(String((e as Error).message ?? e)); }
    finally { setLoading(false); }
  }, [vendorId, dari, sampai, vendors, page]);

  const td = "border border-gf-border px-1 py-[1px]";
  const totDebet = rows.reduce((s, r) => s + Number(r.debet ?? 0), 0);
  const totKredit = rows.reduce((s, r) => s + Number(r.kredit ?? 0), 0);
  const saldoAkhir = rows.length > 0 ? Number(rows[0].saldo ?? 0) : 0;

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Kartu Hutang</div>
        <div className="p-2">
          <div className="mb-1 grid grid-cols-[80px_1fr_70px_330px] items-center gap-x-2 gap-y-1 text-[12px]">
            <span>Vendor :</span>
            <select className="gf-3d w-[380px] bg-white px-1 py-[2px]" value={vendorId ?? ""} onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">(Semua vendor)</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
            </select>
            <span className="text-right">M.U. :</span>
            <div className="flex items-center gap-2">
              <select className="gf-3d w-[80px] bg-white px-1 py-[2px] text-[11px]"><option>IDR</option></select>
              <span className="text-[11px]">(Pembelian Credit / Retur Pembelian Credit / Pembayaran / Deposit)</span>
            </div>
            <span>Tanggal :</span>
            <div className="flex items-center gap-1">
              <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
              <span>-</span>
              <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            </div>
            <span className="text-right">Jenis :</span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {["Pembelian Credit", "Retur Pembelian Credit", "Pembayaran", "Deposit"].map((t) => (
                <label key={t} className="flex items-center gap-1"><input type="checkbox" defaultChecked /> {t}</label>
              ))}
            </div>
          </div>
          <div className="mb-1 flex gap-1">
            <button onClick={proses} className="gf-3d w-[240px] bg-gf-menubar py-[4px] text-[12px] font-bold">Proses</button>
            <button onClick={() => { setRows([]); setVendorId(null); setDari(""); setSampai(""); setMsg("Dibatalkan."); }} className="gf-3d w-[240px] bg-gf-menubar py-[4px] text-[12px]">Batal</button>
            <button onClick={() => setMsg("ReSort ListView — urut selesai per tanggal")} className="gf-3d w-[240px] bg-gf-menubar py-[4px] text-[12px]">ReSort ListView</button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}

          <div className="max-h-[400px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["Jenis", "Tanggal", "No", "Vendor", "Nilai", "Debet", "Kredit", "Saldo"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className={td}>{r.jenis}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.vendorNama}</td>
                    <td className={`${td} text-right font-mono`}>{r.nilai}</td>
                    <td className={`${td} text-right font-mono`}>{r.debet}</td>
                    <td className={`${td} text-right font-mono`}>{r.kredit}</td>
                    <td className={`${td} text-right font-mono font-bold`}>{r.saldo}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">{loading ? "Memproses..." : "Pilih vendor (opsional) lalu Proses."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-gf-muted">
            <Pager page={page} total={total} onPage={setPage} className="w-full" />
            <span>Debet: <b className="font-mono">{rp(totDebet)}</b></span>
            <span>Kredit: <b className="font-mono">{rp(totKredit)}</b></span>
            <span>Saldo (baris teratas): <b className="font-mono">{rp(saldoAkhir)}</b></span>
          </div>
          <div className="mt-1 text-[10px] text-gf-muted">Sumber: s_pembel(+) / s_retpem(−) / s_lunpem via s_lpemma non-hapus(−, lunas−disc+denda) / s_deppem(−).</div>

          <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d w-[320px] bg-gf-menubar py-[3px] text-[12px]">Cetak Setup</button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d w-[320px] bg-gf-menubar py-[3px] text-[12px]">Cetak</button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d w-[320px] bg-gf-menubar py-[3px] text-[12px]">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
