"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Row = {
  id: number; no?: string | null; tanggal?: string | null; vendorNama?: string | null;
  divisiId?: number | null; purcorId?: number | null; totHarga?: string | null; totDisc?: string | null;
  adjNilai?: string | null; ppnNilai?: string | null; deposit?: string | null; kurs?: string | null;
  termCrd?: number | null; jatuhTempo?: string | null; lunasOn?: string | null; lunasOnDisc?: string | null;
  konfOleh?: number | null; catatan?: string | null;
  total?: string | null; dibayar?: string | null; retur?: string | null; sisa?: string | null;
};

const F = `id no tanggal vendorNama divisiId purcorId totHarga totDisc adjNilai ppnNilai deposit kurs termCrd jatuhTempo lunasOn lunasOnDisc konfOleh catatan total dibayar retur sisa`;
const LIST = `query($q:String){ daftarHutangList(q:$q, limit:500){ total rows { ${F} } } }`;
const VREF = `{ vendorRefList { id nama } }`;
const ICON = "/gf-icons/screens/pembelian";

const rp = (v: unknown): string => Number(v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DaftarHutangPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(true);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [vend, setVend] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ daftarHutangList: { total: number; rows: Row[] } }>(LIST, { q: q || null });
    setRows(d.daftarHutangList.rows); setTotal(d.daftarHutangList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[] }>(VREF).then((d) => setVendors(d.vendorRefList)).catch(() => undefined);
  }, [load]);

  const shown = useMemo(() => {
    let r = rows;
    if (vend != null) r = r.filter((x) => x.vendorNama === vendors.find((v) => v.id === vend)?.nama);
    if (only) r = r.filter((x) => Number(x.sisa ?? 0) > 0.0001);
    return r;
  }, [rows, only, vend, vendors]);
  const sumSisa = shown.reduce((s, r) => s + Number(r.sisa ?? 0), 0);
  const sumTotal = shown.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const sumBayar = shown.reduce((s, r) => s + Number(r.dibayar ?? 0), 0);

  const td = "border border-gf-border px-1 py-[1px]";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1280px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Daftar Hutang</div>
        <div className="p-2">
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button onClick={() => setMsg("Menu — gunakan menu utama")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/laporan.png`} alt="Laporan" width={54} height={44} /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">D A F T A R&nbsp;&nbsp;H U T A N G</span>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar w-[130px] py-[8px] text-[11px]">Tutup</button>
          </div>
          <div className="grid grid-cols-[420px_1fr] gap-2">
            <div className="border border-gf-border bg-white">
              <div className="flex items-center border-b border-gf-border bg-gf-menubar px-1 text-[11px]">
                <span className="font-bold">Vendor</span>
                {vend != null && <button onClick={() => setVend(null)} className="gf-3d ml-auto bg-gf-menubar px-1 text-[10px]">× clear</button>}
              </div>
              <div className="h-[150px] overflow-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-[#efefef]">
                    {["Nama", "Alamat", "ID"].map((h) => <th key={h} className="border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id} onClick={() => setVend(v.id)} onDoubleClick={() => setQ(v.nama)} className={`cursor-pointer ${vend === v.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`} title="Double-click: cari nota vendor ini">
                        <td className={td}>{v.nama}</td><td className={td} /><td className={td}>{v.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <button onClick={() => { setMsg("Proses"); void load(); }} className="gf-3d bg-gf-menubar px-6 py-[4px] text-[12px] font-bold">Proses</button>
              <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / vendor..." value={q} onChange={(e) => setQ(e.target.value)} />
              <label className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Yang Belum Ada Pelunasan</label>
              <label className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={!only} onChange={(e) => setOnly(!e.target.checked)} /> Yang Sudah Ada Pelunasan</label>
            </div>
          </div>
          {err && <div className="mb-2 mt-1 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 mt-1 text-[11px] text-gf-muted">{msg}</div>}

          <div className="mt-2 max-h-[420px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["Nomor", "Tanggal", "MU", "Sisa Hutang", "Vendor", "Divisi", "PO", "Harga", "Discount", "Adjust", "PJK", "Retur", "Deposit", "Telah Lunas", "Lunas On", "Lunas On (Disc)", "Jatuh Tempo", "Confirm", "Kurs", "Catatan", "Pembelian No"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="hover:bg-[#e8eef7]">
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>IDR</td>
                    <td className={`${td} text-right font-mono font-bold`}>{rp(r.sisa)}</td>
                    <td className={td}>{r.vendorNama}</td>
                    <td className={td}>{r.divisiId ?? ""}</td>
                    <td className={td}>{r.purcorId ?? ""}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.totHarga)}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.totDisc)}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.adjNilai)}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.ppnNilai)}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.retur)}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.deposit)}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.dibayar)}</td>
                    <td className={td}>{r.lunasOn ?? ""}</td>
                    <td className={td}>{r.lunasOnDisc ?? ""}</td>
                    <td className={td}>{r.jatuhTempo ?? ""}</td>
                    <td className={td}>{r.konfOleh ?? ""}</td>
                    <td className={td}>{r.kurs ?? ""}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.no}</td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={21} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-gf-muted">
            <span>Total nota: {total} · tampil: {shown.length}</span>
            <span>Total: <b className="font-mono">{rp(sumTotal)}</b></span>
            <span>Telah Lunas: <b className="font-mono">{rp(sumBayar)}</b></span>
            <span>Total sisa hutang: <b className="font-mono">{rp(sumSisa)}</b></span>
          </div>
          <div className="mt-1 text-[10px] text-gf-muted">Sumber: s_pembel + s_lunpem (via s_lpemma non-hapus) + s_retpem · Sisa = (Harga+PPN) − Terlunas − Retur · Jatuh Tempo = Tanggal + Credit(hari).</div>
        </div>
      </div>
    </div>
  );
}
