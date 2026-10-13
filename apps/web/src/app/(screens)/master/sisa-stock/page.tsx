"use client";


import { Pager } from "@/components/gf/Pager";
import { ArrowDownAZ, Boxes, FileSpreadsheet, FolderTree, Merge, Menu, Pencil, Plus, Printer, Ruler, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const LIST = `query($q:String, $limit:Int, $offset:Int){ sisaStockList(q:$q, limit:$limit, offset:$offset){ total rows { id nama groupNama kode tipeSatu jenis minStock catatan inputOleh tglInput jamInput ubahOleh tglUbah jamUbah sisa sisaAc hargaJual1 hargaJual2 hargaJual3 hargaJual4 hargaJual5 } } }`;
export default function SisaStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [fId, setFId] = useState("");
  const [fKode, setFKode] = useState("");
  const [fKode2, setFKode2] = useState("");
  const [fGroupII, setFGroupII] = useState("");
  const [fVendor, setFVendor] = useState("");
  const [fNama, setFNama] = useState("");
  const [fCatatan, setFCatatan] = useState("");
  const [fSemua, setFSemua] = useState(false);
  const [fAktif, setFAktif] = useState("Aktif");
  const [tampil, setTampil] = useState("Tampilan Standard");

  useEffect(() => { setPage(1); }, [q]);
  useEffect(() => {
    const parts = [fKode, fKode2, fNama].map((s) => s.trim()).filter(Boolean);
    setQ(parts.join(" "));
  }, [fKode, fKode2, fNama]);
  const load = useCallback(async () => {
    const d = await gql<{ sisaStockList: { total: number; rows: Row[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.sisaStockList.rows);
    setTotal(d.sisaStockList.total);
  }, [q, page]);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const r = rows.find((x) => x.id === sel) ?? null;
  const td = "border border-gf-border px-2 py-[2px]";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Sisa Stock</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <Button variant="default" title="Urut A..Z" onClick={() => setMsg("Urut A..Z")}><ArrowDownAZ className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button variant="default" title="Menu" onClick={() => setMsg("Menu")}><Menu className="h-[14px] w-[14px] text-slate-600" /></Button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;S I S A&nbsp;&nbsp;S T O C K</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <Button variant="default" title="Laporan" onClick={() => { window.location.href = "/laporan"; }}><FileSpreadsheet className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button variant="default" title="Satuan" onClick={() => setMsg("Satuan — menyusul")}><Ruler className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button variant="default" title="Kelompok" onClick={() => setMsg("Kelompok — menyusul")}><FolderTree className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button variant="default" title="Sisa Stock" onClick={() => { window.location.href = "/master/item"; }}><Boxes className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button variant="default" title="Gabungan" onClick={() => setMsg("Gabungan — menyusul")}><Merge className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button variant="default" title="Cetak" onClick={() => setMsg("Cetak — gunakan layar Laporan")}><Printer className="h-[14px] w-[14px] text-slate-600" /></Button>
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button variant="default" disabled title="Tambah — read-only"><Plus className="h-[14px] w-[14px] text-emerald-600" /></Button>
            <Button variant="default" disabled title="Koreksi — read-only"><Pencil className="h-[14px] w-[14px] text-sky-600" /></Button>
            <Button variant="default" disabled title="Hapus — read-only"><Trash2 className="h-[14px] w-[14px] text-red-600" /></Button>
            <Button variant="default" title="Tutup" onClick={() => { window.location.href = "/"; }}><X className="h-[14px] w-[14px] text-slate-500" /></Button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[360px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
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
                  <tr key={x.id} onClick={() => setSel(x.id)} className={`cursor-pointer ${sel === x.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
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

          <div className="mt-2 grid grid-cols-[1fr_300px] gap-2">
            <div className="rounded-md border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <div className="grid grid-cols-[50px_150px_60px_150px_64px_1fr] items-center gap-x-2 gap-y-[3px]">
                <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" value={fId} onChange={(e) => setFId(e.target.value)} />
                <span>Kode :</span><input className="gf-3d bg-white px-2 py-[1px]" value={fKode} onChange={(e) => setFKode(e.target.value)} />
                <span>Kode (2) :</span><input className="gf-3d bg-white px-2 py-[1px]" value={fKode2} onChange={(e) => setFKode2(e.target.value)} />
                <span>Group :</span>
                <span className="col-span-5 flex gap-1">
                  <select className="gf-3d w-[220px] bg-white px-1 py-[1px]"><option>--belum dipilih--</option></select>
                  <select className="gf-3d w-[220px] bg-white px-1 py-[1px]"><option>--belum dipilih--</option></select>
                  <span>Group II :</span>
                  <input className="gf-3d flex-1 bg-white px-2 py-[1px]" value={fGroupII} onChange={(e) => setFGroupII(e.target.value)} />
                </span>
                <span>Vendor :</span><input className="gf-3d col-span-5 bg-white px-2 py-[1px]" value={fVendor} onChange={(e) => setFVendor(e.target.value)} />
                <span>Nama :</span><input className="gf-3d col-span-5 bg-white px-2 py-[1px]" value={fNama} onChange={(e) => setFNama(e.target.value)} />
                <span>Catatan :</span><input className="gf-3d col-span-5 bg-white px-2 py-[1px]" value={fCatatan} onChange={(e) => setFCatatan(e.target.value)} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <label className="flex items-center gap-1"><input type="checkbox" checked={fSemua} onChange={(e) => { setFSemua(e.target.checked); if (e.target.checked) { setFKode(""); setFKode2(""); setFNama(""); } }} /> Semua Data</label>
                <button onClick={() => setMsg("Ctrl+F9")} className="gf-3d bg-gf-menubar px-2 py-[1px]">Ctrl+F9</button>
                <button onClick={() => setMsg("Ctrl+F")} className="gf-3d bg-gf-menubar px-2 py-[1px]">Ctrl+F</button>
                <button onClick={() => setMsg("Ctrl+F7")} className="gf-3d bg-gf-menubar px-2 py-[1px]">Ctrl+F7</button>
                <button onClick={() => setMsg("Ctrl+F6")} className="gf-3d bg-gf-menubar px-2 py-[1px]">Ctrl+F6</button>
              </div>
            </div>
            <div className="rounded-md border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <div className="flex gap-1">
                <button onClick={() => setFAktif(fAktif === "Aktif" ? "Non Aktif" : "Aktif")} className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px]">{fAktif}</button>
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px]">---</button>
              </div>
              <div className="mt-1 text-gf-muted">Mouse klik 2x &gt; Koreksi</div>
              <select className="gf-3d mt-1 w-full bg-white px-1 py-[2px]" value={tampil} onChange={(e) => setTampil(e.target.value)}>
                <option>Tampilan Standard</option>
                <option>Tampil Sisa Stock</option>
                <option>Sisa Stock &lt;&gt; 0</option>
                <option>Sisa Stock &lt; 0</option>
                <option>Sisa Stock = 0</option>
                <option>Tampil &lt;= Minimal Stock</option>
              </select>
              <select className="gf-3d mt-1 w-full bg-white px-1 py-[2px]"><option>---</option></select>
            </div>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
