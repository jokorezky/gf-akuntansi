"use client";





import { Pager } from "@/components/gf/Pager";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuanC?: string | null; satuan?: number | null;
  jumlah?: string | null; harga?: string | null;
  discNilai?: string | null; discPers?: string | null; discPers2?: string | null; discPers3?: string | null;
  nilai?: string | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: number | null; tanggal?: string | null; tglKirim?: string | null; tglTutup?: string | null;
  divisiId?: number | null; jenpemId?: number | null; vendorId?: number | null; vendorNama?: string | null;
  mauang?: number | null; totHarga?: string | null; totDisc?: string | null; discNilai?: string | null;
  ppnTipe?: number | null; ppnPers?: string | null; ppnNilai?: string | null; termBayar?: string | null;
  prtTJml?: boolean | null; prtHarga?: boolean | null; catatan?: string | null; lines?: Line[];
};

const LFIELDS = `stockId stockNama satuan satuanC jumlah harga discNilai discPers discPers2 discPers3 nilai catatan`;
const HFIELDS = `id no tanggal tglKirim tglTutup divisiId jenpemId vendorId vendorNama mauang totHarga totDisc discNilai ppnTipe ppnPers ppnNilai termBayar prtTJml prtHarga catatan`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ purchaseOrderList(q:$q, limit:$limit, offset:$offset){ total rows { ${HFIELDS} } } }`;
const REFS = `{ vendorRefList { id nama } divisiRefList { id nama } jenpenRefList { id nama } itemList(limit:40){ rows { id nama } } }`;
const BYID = `query($id:Int!){ purchaseOrderById(id:$id){ ${HFIELDS} lines { ${LFIELDS} } } }`;
const CREATE = `mutation($input:PurchaseOrderInput!){ createPurchaseOrder(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PurchaseOrderInput!){ updatePurchaseOrder(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePurchaseOrder(id:$id) }`;
const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);

/** Logic GF: nilai baris = (jumlah*harga) berlapis disc% x3 - disc nilai. */
function lineNilai(l: Line): number {
  const gross = num(l.jumlah) * num(l.harga);
  const net = gross * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}

const emptyLine = (): Line => ({ stockId: 0, stockNama: "", jumlah: "1", harga: "0", discNilai: "0", discPers: "0", discPers2: "0", discPers3: "0", catatan: "" });
const emptyHdr = (): Hdr => ({ id: 0, no: null, tanggal: new Date().toISOString().slice(0, 10), tglKirim: "", divisiId: null, jenpemId: null, vendorId: null, mauang: 1, discNilai: "0", ppnTipe: 0, ppnPers: "0.00", prtTJml: false, prtHarga: false, catatan: "", lines: [emptyLine()] });

export default function PurchaseOrderPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [tampil, setTampil] = useState(0);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [jenpem, setJenpem] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [pick, setPick] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ purchaseOrderList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.purchaseOrderList.rows);
    setTotal(d.purchaseOrderList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[]; divisiRefList: Ref[]; jenpenRefList: Ref[]; itemList: { rows: Ref[] } }>(REFS)
      .then((d) => { setVendors(d.vendorRefList); setDivisi(d.divisiRefList); setJenpem(d.jenpenRefList); setItems(d.itemList.rows); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (idx: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, i) => (i === idx ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    let gross = 0;
    let disc = 0;
    for (const l of lines) {
      const g = num(l.jumlah) * num(l.harga);
      gross += g;
      disc += g - lineNilai(l);
    }
    const totHarga = Math.round(gross * 100) / 100;
    const totDisc = Math.round((disc + num(form?.discNilai)) * 100) / 100;
    const total2 = Math.round((totHarga - totDisc) * 100) / 100;
    const ppnNilai = num(form?.ppnPers) > 0 ? Math.round(total2 * num(form?.ppnPers)) / 100 : 0;
    return { totHarga: r2(totHarga), totDisc: r2(totDisc), total: r2(total2), ppnNilai: r2(ppnNilai) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(emptyHdr()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ purchaseOrderById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm(d.purchaseOrderById); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus PO id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, vendorNama: _vn, totHarga: _th, totDisc: _td, ppnNilai: _pn, tglTutup: _tt, ...rest } = form;
      const input = { ...rest, lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, jumlah: l.jumlah, harga: l.harga, satuan: l.satuan, discNilai: l.discNilai, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, catatan: l.catatan })) };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-2 py-[2px]";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Purchase Order</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E M B E L I A N&nbsp;&nbsp;-&nbsp;&nbsp;P U R C H A S E&nbsp;&nbsp;O R D E R</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>(-Semua Divisi-)</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Rincian Per Item — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Tutup PO — pilih PO lalu jalankan dari form (Tutup)")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><Plus className="h-[15px] w-[15px] text-emerald-600" /></Button>
            <Button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Pencil className="h-[15px] w-[15px] text-sky-600" /></Button>
            <Button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Trash2 className="h-[15px] w-[15px] text-red-600" /></Button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[360px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["ID", "PO", "Tanggal", "Tutup", "Vendor", "MU", "Harga", "Discount", "PJK/PPN", "Total", "Divisi", "Jenis Pemb", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const totalRow = num(r.totHarga) - num(r.totDisc);
                  return (
                    <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                      <td className={td}>{r.id}</td>
                      <td className={td}>{r.no}</td>
                      <td className={td}>{r.tanggal}</td>
                      <td className={td}>{r.tglTutup}</td>
                      <td className={td}>{r.vendorNama}</td>
                      <td className={td}>IDR</td>
                      <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                      <td className={`${td} text-right font-mono`}>{r.totDisc}</td>
                      <td className={td}>{r.ppnTipe ? `PJK ${r.ppnPers}%` : "-"}</td>
                      <td className={`${td} text-right font-mono`}>{r2(totalRow)}</td>
                      <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? ""}</td>
                      <td className={td}>{jenpem.find((d) => d.id === r.jenpemId)?.nama ?? ""}</td>
                      <td className={td}>{r.catatan}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={13} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_300px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={sel ?? ""} />
              <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>Tgl Kirim :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>PO :</span><input className="gf-3d bg-white px-2 py-[1px]" placeholder="(cari no PO)" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>Vendor :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.vendorNama ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.catatan ?? ""} />
              <label className="col-span-2 flex items-center gap-1"><input type="checkbox" /> Semua Data</label>
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              {["Tampil Semuanya", "Tampil Yang Belum Terealisasi Penuh", "Tampil Yang Sudah Terealisasi Penuh"].map((t, i) => (
                <label key={t} className="flex items-center gap-1 leading-[18px]">
                  <input type="radio" checked={tampil === i} onChange={() => { setTampil(i); if (i > 0) setMsg("Filter realisasi: menyusul (butuh hitung realisasi Pembelian)"); }} />
                  {t}
                </label>
              ))}
              <div className="mt-1 flex gap-1">
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-green-700">Ctrl+F7</button>
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-gf-muted">Ctrl+F6</button>
              </div>
            </div>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[1200px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Purchase Order {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[70px_130px_70px_150px_70px_1fr] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>P.O. No. :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value ? Number(e.target.value) : null })} />
                <span>Tanggal :</span>
                <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} />
                <span>Divisi :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--Semua Divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span>Vendor :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--pilih vendor--</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
                <span>M.U. :</span>
                <select className="gf-3d w-[90px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}><option value={1}>IDR</option></select>
                <span>Discount :</span>
                <input className="gf-3d w-[120px] bg-white px-2 py-[2px] text-right font-mono" value={form.discNilai ?? "0"} onChange={(e) => set({ discNilai: e.target.value })} />
                <span>Jenis Pemb :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.jenpemId ?? ""} onChange={(e) => set({ jenpemId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">---</option>{jenpem.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span>Tgl Kirim :</span>
                <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={form.tglKirim ?? ""} onChange={(e) => set({ tglKirim: e.target.value })} />
                <span>Pajak :</span>
                <select className="gf-3d w-[80px] bg-white px-1 py-[2px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right" value={form.ppnPers ?? "0.00"} onChange={(e) => set({ ppnPers: e.target.value })} />
                <span>Catatan :</span>
                <input className="gf-3d col-span-5 bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
              </div>

              <div className="mt-2 flex items-center justify-between border border-gf-border bg-[#f4f4f4] px-3 py-1 text-[12px]">
                <span className="font-bold tracking-[3px]">T O T A L</span>
                <span>Total Discount : <b className="font-mono">{totals.totDisc}</b></span>
                <span>PPN : <b className="font-mono">{form.ppnTipe ? totals.ppnNilai : "0.00"}</b></span>
                <span>Total Harga : <b className="font-mono">{totals.total}</b></span>
              </div>

              <div className="mt-2 max-h-[300px] overflow-auto rounded-lg border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    {["", "Kode", "Nama", "Jumlah", "@", "Harga", "Discount", "Disc%", "Disc%2", "Disc%3", "Nilai", "Jml-SatKecil", "(Pb) Real", "(Pb)%Real", "(Pb) BlmReal", "(Pb)%Blm", "Catatan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>{i + 1}</td>
                        <td className={`${td} w-[80px]`}>
                          <input className="w-full bg-transparent text-right" value={l.stockId || ""} onChange={(e) => setLine(i, { stockId: Number(e.target.value) || 0 })} />
                        </td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>
                            {items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}>
                          <input className="w-[60px] bg-transparent text-right" value={l.jumlah ?? ""} onChange={(e) => setLine(i, { jumlah: e.target.value })} />
                        </td>
                        <td className={td}>x</td>
                        <td className={td}>
                          <input className="w-[90px] bg-transparent text-right font-mono" value={l.harga ?? ""} onChange={(e) => setLine(i, { harga: e.target.value })} />
                        </td>
                        <td className={td}>
                          <input className="w-[80px] bg-transparent text-right font-mono" value={l.discNilai ?? "0"} onChange={(e) => setLine(i, { discNilai: e.target.value })} />
                        </td>
                        <td className={td}><input className="w-[46px] bg-transparent text-right" value={l.discPers ?? "0"} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                        <td className={td}><input className="w-[46px] bg-transparent text-right" value={l.discPers2 ?? "0"} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                        <td className={td}><input className="w-[46px] bg-transparent text-right" value={l.discPers3 ?? "0"} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                        <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                        <td className={td}>1</td>
                        <td className={td} /><td className={td} /><td className={td} /><td className={td} />
                        <td className={td}><input className="w-[120px] bg-transparent" value={l.catatan ?? ""} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                <button onClick={() => setLsel((x) => Math.max(0, x - 1))} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{"<"}</button>
                <button onClick={() => setLsel((x) => Math.min((form.lines?.length ?? 1) - 1, x + 1))} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{">"}</button>
                <button onClick={() => setMsg("Lainnya — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Lainnya</button>
                <button onClick={() => set({ prtTJml: !form.prtTJml })} className={`gf-3d px-2 py-[2px] text-[11px] ${form.prtTJml ? "bg-gf-hl text-white" : "bg-gf-menubar"}`}>Cetak Keluar Total Jumlah/Quantity</button>
                <button onClick={() => set({ prtHarga: !form.prtHarga })} className={`gf-3d px-2 py-[2px] text-[11px] ${form.prtHarga ? "bg-gf-hl text-white" : "bg-gf-menubar"}`}>Cetak Keluar Harga PO</button>
                <button onClick={() => setPick(true)} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Tambah dari Master File</button>
                <button onClick={() => setMsg("Copy Dari SO — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Copy Dari SO</button>
                <span className="mx-1 text-gf-muted">|</span>
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()], id: form.id })} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Tambah</button>
                <button onClick={() => { const l = (form.lines ?? [])[lsel]; if (!l) { setMsg("Pilih baris."); return; } setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`); }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Koreksi</button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel), id: form.id })} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Hapus</button>
                <button onClick={onSimpan} className="gf-3d ml-auto w-[220px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[220px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              {msg && <div className="mt-1 text-[11px] text-gf-muted">{msg}</div>}
            </div>
          </div>
        </div>
      )}

      {pick && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setPick(false)}>
          <div className="w-[420px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[13px] font-bold">Tambah dari Master File</div>
            <div className="mb-1 text-[11px] text-gf-muted">Pilih item (40 item pertama):</div>
            <div className="max-h-[300px] overflow-auto rounded-lg border border-gf-border bg-white">
              {items.map((x) => (
                <button key={x.id} className="block w-full px-2 py-[2px] text-left text-[12px] hover:bg-[#e8eef7]" onClick={() => { set({ lines: [...(form.lines ?? []), { ...emptyLine(), stockId: x.id, stockNama: x.nama }], id: form.id }); setPick(false); }}>
                  {x.id} — {x.nama}
                </button>
              ))}
            </div>
            <div className="mt-2 text-right"><button onClick={() => setPick(false)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
