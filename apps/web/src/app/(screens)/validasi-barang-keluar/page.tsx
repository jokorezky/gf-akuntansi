"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@/lib/graphql";

type Item = { id: number; nama: string };
type Row = { kode: string; nama: string; jml: string; satuan: string; scan: string; grup: string };

const ITEMS = `query{ itemList(limit:500){ rows { id nama } } }`;
const SALE = `query($id:Int!){ saleById(id:$id){ id no lines { stockId stockNama jumlah satuanId } } }`;
const PINDAH = `query($id:Int!){ barangPindahGudangById(id:$id){ id no lines { stockId stockNama jumlah } } }`;

export default function ValidasiBarangKeluarPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [penjualan, setPenjualan] = useState("PJ");
  const [pindahGdg, setPindahGdg] = useState("PG");
  const [tutupError, setTutupError] = useState("5");
  const [scan, setScan] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [log, setLog] = useState<string[]>(["Validasi Barang Keluar — siap scan.", "Isi Penjualan (ID nota) / Pindah Gdg (ID pindah) utk validasi lawan dokumen."]);
  const [errCount, setErrCount] = useState(0);
  const [stopped, setStopped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gql<{ itemList: { rows: Item[] } }>(ITEMS).then((d) => setItems(d.itemList.rows)).catch(() => undefined);
    inputRef.current?.focus();
  }, []);

  const notaSale = useCallback(async (): Promise<Map<number, number> | null> => {
    const id = Number(penjualan);
    if (!penjualan || !Number.isFinite(id) || id <= 0) return null;
    try {
      const d = await gql<{ saleById: { lines?: { stockId: number; jumlah?: string | null }[] | null } | null }>(SALE, { id });
      if (!d.saleById?.lines) return null;
      const m = new Map<number, number>();
      for (const l of d.saleById.lines) m.set(l.stockId, (m.get(l.stockId) ?? 0) + Number(l.jumlah ?? 0));
      return m;
    } catch { return null; }
  }, [penjualan]);

  const notaPindah = useCallback(async (): Promise<Map<number, number> | null> => {
    const id = Number(pindahGdg);
    if (!pindahGdg || !Number.isFinite(id) || id <= 0) return null;
    try {
      const d = await gql<{ barangPindahGudangById: { lines?: { stockId: number; jumlah?: string | null }[] | null } | null }>(PINDAH, { id });
      if (!d.barangPindahGudangById?.lines) return null;
      const m = new Map<number, number>();
      for (const l of d.barangPindahGudangById.lines) m.set(l.stockId, (m.get(l.stockId) ?? 0) + Number(l.jumlah ?? 0));
      return m;
    } catch { return null; }
  }, [pindahGdg]);

  async function doScan(codeRaw: string) {
    const code = codeRaw.trim();
    if (!code) return;
    const asId = Number(code);
    const it = items.find((x) => String(x.id) === code) ?? items.find((x) => x.nama.toLowerCase().includes(code.toLowerCase()));
    if (!it) {
      setLog((l) => [...l.slice(-200), `ERROR: kode "${code}" tidak ditemukan di master item.`]);
      registerError(); return;
    }
    let status = "OK";
    const saleMap = await notaSale();
    const pindahMap = await notaPindah();
    if (saleMap && !saleMap.has(it.id)) status = "TIDAK ADA DI NOTA PJ";
    if (pindahMap && !pindahMap.has(it.id)) status = "TIDAK ADA DI NOTA PG";
    if (!saleMap && !pindahMap) status = "OK (tanpa nota)";
    setRows((r) => [...r.slice(-199), { kode: String(it.id), nama: it.nama, jml: "1", satuan: "PCS", scan: status === "OK" || status.startsWith("OK") ? "✔" : "✖", grup: "" }]);
    setLog((l) => [...l.slice(-200), `SCAN ${code} -> ${it.nama} : ${status}`]);
    if (!(status === "OK" || status.startsWith("OK"))) registerError();
  }
  function registerError() {
    setErrCount((c) => {
      const n = c + 1;
      const limit = Math.max(1, Number(tutupError) || 5);
      if (n >= limit) {
        setStopped(true);
        setLog((l) => [...l.slice(-200), `TUTUP ERROR: batas ${limit} tercapai — validasi dihentikan.`]);
      }
      return n;
    });
  }

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div className="min-h-full bg-gf-bg p-2 text-gf-text">
      <div className="mx-auto max-w-[1280px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Validasi Barang Keluar</div>
        <div className="p-2">
          <div className="grid grid-cols-[220px_1fr] gap-2">
            <div className="border border-gf-border bg-white p-2 text-[12px]">
              <select className="gf-3d mb-2 w-full bg-white px-1 py-[2px] text-[11px]">
                <option>Scan Cty live Nota</option>
              </select>
              <div className="grid grid-cols-[80px_1fr] items-center gap-x-1 gap-y-1">
                <span>Penjualan :</span>
                <input className="gf-3d w-[70px] bg-white px-2 py-[1px]" value={penjualan} onChange={(e) => setPenjualan(e.target.value)} />
                <span>Pindah Gdg :</span>
                <input className="gf-3d w-[70px] bg-white px-2 py-[1px]" value={pindahGdg} onChange={(e) => setPindahGdg(e.target.value)} />
                <span>Tutup Error :</span>
                <input className="gf-3d w-[70px] bg-white px-2 py-[1px] text-right" value={tutupError} onChange={(e) => setTutupError(e.target.value)} />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <input ref={inputRef} className="gf-3d flex-1 bg-white px-2 py-[2px] text-[12px]"
                  placeholder={stopped ? "(dihentikan)" : "Scan kode / nama item + Enter..."} value={scan} disabled={stopped}
                  onChange={(e) => setScan(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { void doScan(scan); setScan(""); } }} />
                <button onClick={() => { void doScan(scan); setScan(""); }} disabled={stopped} className={`gf-3d bg-gf-menubar px-3 py-[2px] text-[11px] ${stopped ? "opacity-40" : ""}`}>Scan</button>
              </div>
              <div className="mt-1 text-[10px] text-gf-muted">Scan: {total} · Error: {errCount} / {tutupError}</div>
            </div>
            <div className="border border-gf-border">
              <div className="bg-black px-2 py-1 text-[11px] text-gf-muted">Log :</div>
              <div className="h-[150px] overflow-auto bg-[#fff2c0] px-2 py-1 font-mono text-[11px] leading-[16px]">
                {log.map((l, i) => <div key={i} className={l.startsWith("ERROR") || l.startsWith("TUTUP") ? "text-red-700" : ""}>{l}</div>)}
              </div>
            </div>
          </div>

          <div className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["No.", "Kode", "Nama", "Jml", "Satuan", "Scan", "Group"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.scan === "✖" ? "bg-[#ffe0e0]" : ""}>
                    <td className="border border-gf-border px-1 py-[1px]">{i + 1}</td>
                    <td className="border border-gf-border px-1 py-[1px]">{r.kode}</td>
                    <td className="border border-gf-border px-1 py-[1px]">{r.nama}</td>
                    <td className="border border-gf-border px-1 py-[1px] text-right">{r.jml}</td>
                    <td className="border border-gf-border px-1 py-[1px]">{r.satuan}</td>
                    <td className="border border-gf-border px-1 py-[1px]">{r.scan}</td>
                    <td className="border border-gf-border px-1 py-[1px]">{r.grup}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="px-2 py-6 text-center text-gf-muted">Belum ada hasil scan.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-gf-border pt-2">
            <button onClick={() => { setRows([]); setLog(["Log dibersihkan."]); setErrCount(0); setStopped(false); inputRef.current?.focus(); }} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[12px]">Bersihkan</button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d mx-auto w-[420px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
