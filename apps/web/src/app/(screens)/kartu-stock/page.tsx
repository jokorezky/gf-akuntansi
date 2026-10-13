"use client";


import { Pager } from "@/components/gf/Pager";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Row = {
  stockId?: number | null; stockNama?: string | null; tanggal?: string | null; keterangan?: string | null;
  gudang?: number | null; debet?: string | null; kredit?: string | null; saldo?: string | null;
  outputDari?: string | null; mu?: number | null; hargaAt?: string | null; nilai?: string | null;
  hpp?: string | null; sisa?: string | null; catatan?: string | null; info?: string | null;
};

const F = `stockId stockNama tanggal keterangan gudang debet kredit saldo outputDari mu hargaAt nilai hpp sisa catatan info`;
const LIST = `query($q:String,$stockId:Int,$tampilBatal:Boolean,$limit:Int,$offset:Int){ kartuStockList(q:$q, stockId:$stockId, tampilBatal:$tampilBatal, limit:$limit, offset:$offset){ total rows { ${F} } } }`;
const REFS = `{ itemList(limit:500){ rows { id nama } } }`;
const SISA = `query($id:Int!){ trfSisaStock(stockId:$id){ stockId nama sisa } }`;

const rp = (v: unknown): string => Number(v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function KartuStockPage() {
  const [items, setItems] = useState<Ref[]>([]);
  const [stockId, setStockId] = useState<number | null>(null);
  const [tampilBatal, setTampilBatal] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sisaAwal, setSisaAwal] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gql<{ itemList: { rows: Ref[] } }>(REFS).then((d) => setItems(d.itemList.rows)).catch(() => undefined);
  }, []);

  const proses = useCallback(async () => {
    setErr(""); setMsg(""); setLoading(true);
    try {
      const d = await gql<{ kartuStockList: { total: number; rows: Row[] } }>(LIST, { q: null, stockId: stockId ?? null, tampilBatal, limit: 10, offset: (page - 1) * 10 });
      setRows(d.kartuStockList.rows); setTotal(d.kartuStockList.total);
      setMsg(`${d.kartuStockList.total} mutasi${stockId ? ` — item #${stockId}` : " (semua item)"}.`);
      if (stockId) {
        const s = await gql<{ trfSisaStock: { sisa?: string | null } | null }>(SISA, { id: stockId });
        setSisaAwal(s.trfSisaStock?.sisa ?? null);
      } else setSisaAwal(null);
    } catch (e) { setErr(String((e as Error).message ?? e)); }
    finally { setLoading(false); }
  }, [stockId, tampilBatal, page]);

  const td = "border border-gf-border px-1 py-[1px]";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1320px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Kartu Stock</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-2 text-[12px]">
            <button onClick={() => setTampilBatal(!tampilBatal)} className={`gf-3d px-3 py-[3px] text-[11px] ${tampilBatal ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Tampil yang dibatal</button>
            <span>Item :</span>
            <select className="gf-3d w-[380px] bg-white px-1 py-[2px]" value={stockId ?? ""} onChange={(e) => setStockId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">(Semua item)</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.nama}</option>)}
            </select>
            <button onClick={() => setMsg("Lookup item — gunakan combo Item")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{"<>"}</button>
            <button onClick={proses} className="gf-3d w-[240px] bg-gf-menubar py-[4px] text-[12px] font-bold">Proses</button>
            <button onClick={() => { setRows([]); setStockId(null); setTampilBatal(false); setMsg("Dibatalkan."); }} className="gf-3d w-[240px] bg-gf-menubar py-[4px] text-[12px]">Batal</button>
          </div>
          {sisaAwal != null && <div className="mb-1 text-[11px]">Rincian Stock Awal: <b className="font-mono">{rp(sisaAwal)}</b> (sisa_stk01)</div>}
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}

          <div className="max-h-[430px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["Tanggal", "Keterangan", "Debet", "Kredit", "Saldo", "Output-Dari", "MU", "@", "Nilai", "Kode", "MU", "@HPP", "HPP", "Sisa", "Expired", "Catatan-Item Entry", "Catatan", "Info"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.keterangan}</td>
                    <td className={`${td} text-right font-mono`}>{r.debet}</td>
                    <td className={`${td} text-right font-mono`}>{r.kredit}</td>
                    <td className={`${td} text-right font-mono font-bold`}>{r.saldo}</td>
                    <td className={td}>{r.outputDari}</td>
                    <td className={td}>IDR</td>
                    <td className={`${td} text-right font-mono`}>{r.hargaAt}</td>
                    <td className={`${td} text-right font-mono`}>{r.nilai}</td>
                    <td className={td}>{r.stockId}</td>
                    <td className={td}>IDR</td>
                    <td className={`${td} text-right font-mono`}>{r.hpp}</td>
                    <td className={`${td} text-right font-mono`}>{r.hpp}</td>
                    <td className={`${td} text-right font-mono`}>{r.sisa}</td>
                    <td className={td} />
                    <td className={td} />
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.info}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={18} className="px-2 py-3 text-center text-gf-muted">{loading ? "Memproses..." : "Pilih item (opsional) lalu Proses."}</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
          <div className="mt-1 text-[10.5px] text-slate-400">· sumber: s_stkmex+s_stkkex (Barang Masuk/Keluar) · Saldo = rolling qty per item.</div>

          <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
            <button onClick={() => setMsg("Rincian Stock Awal — ditampilkan di atas (sisa_stk01 item terpilih)")} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Rincian Stock Awal</button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Cetak Setup</button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Cetak</button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d w-[280px] bg-gf-menubar py-[3px] text-[12px]">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
