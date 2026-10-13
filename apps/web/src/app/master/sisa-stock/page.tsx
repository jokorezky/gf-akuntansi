"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  id: number; nama: string; groupNama?: string | null; kode?: string | null; tipeSatu?: number | null;
  jenis?: number | null; minStock?: string | null; catatan?: string | null;
  inputOleh?: number | null; tglInput?: string | null; jamInput?: string | null;
  ubahOleh?: number | null; tglUbah?: string | null; jamUbah?: string | null;
  sisa?: string | null; sisaAc?: string | null;
  hargaJual1?: string | null; hargaJual2?: string | null; hargaJual3?: string | null;
  hargaJual4?: string | null; hargaJual5?: string | null;
};

const LIST = `query($q:String){ sisaStockList(q:$q){ total rows { id nama groupNama kode tipeSatu jenis minStock catatan inputOleh tglInput jamInput ubahOleh tglUbah jamUbah sisa sisaAc hargaJual1 hargaJual2 hargaJual3 hargaJual4 hargaJual5 } } }`;
const ICON = "/gf-icons/screens/item";

export default function SisaStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ sisaStockList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.sisaStockList.rows);
    setTotal(d.sisaStockList.total);
  }, [q]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const r = rows.find((x) => x.id === sel) ?? null;
  const td = "border border-gf-border px-2 py-[2px]";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Sisa Stock</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut A..Z")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="A..Z" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;S I S A&nbsp;&nbsp;S T O C K</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/laporan.png`} alt="Laporan" width={54} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Satuan — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/satuan.png`} alt="Satuan" width={49} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Kelompok — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/kelompok.png`} alt="Kelompok" width={48} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/master/item"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/sisa-stock.png`} alt="Item" width={49} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Gabungan — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/gabungan.png`} alt="Gabungan" width={48} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak.png`} alt="Cetak" width={47} height={44} unoptimized /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari nama / barcode..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={() => setMsg("Tambah — Sisa Stock bersifat read-only")} className="gf-3d bg-gf-menubar p-[1px] opacity-60"><Image src={`${ICON}/tambah.png`} alt="Tambah" width={54} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Koreksi — Sisa Stock bersifat read-only")} className="gf-3d bg-gf-menubar p-[1px] opacity-60"><Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={54} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Hapus — Sisa Stock bersifat read-only")} className="gf-3d bg-gf-menubar p-[1px] opacity-60"><Image src={`${ICON}/hapus.png`} alt="Hapus" width={54} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup.png`} alt="Tutup" width={58} height={44} unoptimized /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[360px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["Group", "Kode", "Nama", "Tipe Satuan", "Sisa AC",
                  "Harga Jual #1", "Disc% #1", "Disc2% #1", "Disc3% #1",
                  "Harga Jual #2", "Disc% #2", "Disc2% #2", "Disc3% #2",
                  "Harga Jual #3", "Disc% #3", "Disc2% #3", "Disc3% #3",
                  "Harga Jual #4", "Disc% #4", "Disc2% #4", "Disc3% #4",
                  "Harga Jual #5", "Disc% #5", "Disc2% #5", "Disc3% #5",
                  "Jenis", "Min Stock", "Catatan", "ID",
                  "Entry By", "Entry Date", "Entry Time", "Last-Edit By", "Last-Edit Date", "Last-Edit Time"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id} onClick={() => setSel(x.id)} className={`cursor-pointer ${sel === x.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{x.groupNama}</td>
                    <td className={td}>{x.kode}</td>
                    <td className={td}>{x.nama}</td>
                    <td className={td}>{x.tipeSatu}</td>
                    <td className={`${td} text-right font-mono`}>{x.sisaAc}</td>
                    {[x.hargaJual1, x.hargaJual2, x.hargaJual3, x.hargaJual4, x.hargaJual5].map((hj, i) => (
                      <span key={i} className="contents">
                        <td className={`${td} text-right font-mono`}>{hj}</td>
                        <td className={`${td} text-right`} />
                        <td className={`${td} text-right`} />
                        <td className={`${td} text-right`} />
                      </span>
                    ))}
                    <td className={td}>{x.jenis}</td>
                    <td className={`${td} text-right`}>{x.minStock}</td>
                    <td className={td}>{x.catatan}</td>
                    <td className={`${td} text-right`}>{x.id}</td>
                    <td className={td}>{x.inputOleh}</td>
                    <td className={td}>{x.tglInput}</td>
                    <td className={td}>{x.jamInput}</td>
                    <td className={td}>{x.ubahOleh}</td>
                    <td className={td}>{x.tglUbah}</td>
                    <td className={td}>{x.jamUbah}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={35} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_320px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={r?.id ?? ""} />
              <span>Group :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={r?.groupNama ?? ""} />
              <span>Kode :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={r?.kode ?? ""} />
              <span>Jenis :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={r?.jenis ?? ""} />
              <span>Nama :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={r?.nama ?? ""} />
              <span>Min Stock :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={r?.minStock ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={r?.catatan ?? ""} />
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <div className="flex gap-1">
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px]">Aktif</button>
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px]">---</button>
              </div>
              <div className="mt-1 text-gf-muted">Mouse klik 2x &gt; Koreksi</div>
              <select className="gf-3d mt-1 w-full bg-white px-1 py-[2px]"><option>Tampilan Standard</option><option>Tampil Sisa Stock</option><option>Sisa Stock &lt;&gt; 0</option><option>Sisa Stock &lt; 0</option><option>Sisa Stock = 0</option><option>Tampil &lt;= Minimal Stock</option></select>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>
    </div>
  );
}
