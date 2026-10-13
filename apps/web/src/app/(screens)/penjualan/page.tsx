"use client";





import { Pager } from "@/components/gf/Pager";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuan?: string | null; satuanId?: number | null;
  jumlah?: string | null; bonus?: string | null; harga?: string | null;
  discPers?: string | null; discPers2?: string | null; discPers3?: string | null; discNilai?: string | null;
  nilai?: string | null; expired?: string | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; pelangId?: number | null; pelangNama?: string | null;
  gudang?: number | null; salordId?: number | null; po?: string | null; salesId?: number | null; salesKom?: string | null;
  mauang?: number | null; kurs?: string | null; totHarga?: string | null; totDisc?: string | null; discNilai?: string | null;
  totRetur?: string | null; ppnTipe?: number | null; ppnPers?: string | null; ppnNilai?: string | null;
  adj01?: string | null; adj02?: string | null; adj03?: string | null; adj04?: string | null; adj05?: string | null;
  deposit?: string | null; termCrd?: number | null; lunas?: string | null;
  noPjk?: number | null; noPjkSr?: number | null; tglPajak?: string | null; kursPajak?: string | null;
  catatan?: string | null; lines?: Line[];
};

const LF = `stockId stockNama satuan satuanId jumlah bonus harga discPers discPers2 discPers3 discNilai nilai expired catatan`;
const HF = `id no tanggal pelangId pelangNama gudang salordId po salesId salesKom mauang kurs totHarga totDisc discNilai totRetur ppnTipe ppnPers ppnNilai adj01 adj02 adj03 adj04 adj05 deposit termCrd lunas noPjk noPjkSr tglPajak kursPajak catatan`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ saleList(q:$q, limit:$limit, offset:$offset){ total rows { ${HF} } } }`;
const REFS = `{ pelangganRefList { id nama } itemList(limit:40){ rows { id nama } } }`;
const SO_LIST = `{ salesOrderList(limit:40){ rows { id no } } }`;
const SO_BYID = `query($id:Int!){ salesOrderById(id:$id){ id pelangId lines { stockId jumlah harga discPers } } }`;
const BYID = `query($id:Int!){ saleById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:SaleInput!){ createSale(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:SaleInput!){ updateSale(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteSale(id:$id) }`;
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
function lineNilai(l: Line): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", bonus: "0", harga: "0", discPers: "0", discPers2: "0", discPers3: "0", discNilai: "0", expired: "", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), pelangId: null, gudang: 1,
  salordId: null, po: "", salesId: null, salesKom: "0.00", mauang: 1, kurs: "1.0000",
  discNilai: "0", ppnTipe: 0, ppnPers: "0.00", adj01: "0", adj02: "0", adj03: "0", adj04: "0", adj05: "0",
  deposit: "0", termCrd: 0, lunas: "0", noPjk: null, noPjkSr: null, tglPajak: "", kursPajak: "1.0000", catatan: "", lines: [emptyLine()],
});

const TABS = ["Penjualan", "Info Tambahan"];

export default function PenjualanPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [belum, setBelum] = useState(true);
  const [sudah, setSudah] = useState(true);
  const [pelanggan, setPelanggan] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [tab, setTab] = useState(0);
  const [lsel, setLsel] = useState(0);
  const [pickSo, setPickSo] = useState(false);
  const [soRows, setSoRows] = useState<{ id: number; no?: string | null }[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ saleList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 15, offset: (page - 1) * 15 });
    setRows(d.saleList.rows);
    setTotal(d.saleList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ pelangganRefList: Ref[]; itemList: { rows: Ref[] } }>(REFS)
      .then((d) => { setPelanggan(d.pelangganRefList); setItems(d.itemList.rows); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    let gross = 0, disc = 0;
    for (const l of lines) { const g = num(l.jumlah) * num(l.harga); gross += g; disc += g - lineNilai(l); }
    const totHarga = Math.round(gross * 100) / 100;
    const totDisc = Math.round((disc + num(form?.discNilai)) * 100) / 100;
    const totRetur = num(form?.totRetur);
    const adj = num(form?.adj01) + num(form?.adj02) + num(form?.adj03) + num(form?.adj04) + num(form?.adj05);
    const totalB = Math.round((totHarga - totDisc - totRetur + adj) * 100) / 100;
    const ppn = num(form?.ppnPers) > 0 ? Math.round(totalB * num(form?.ppnPers)) / 100 : 0;
    return { totHarga: r2(totHarga), totDisc: r2(totDisc), totRetur: r2(totRetur), adj: r2(adj), total: r2(totalB), ppn: r2(ppn) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setTab(0); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ saleById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setTab(0); setForm(d.saleById); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus penjualan id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, pelangNama: _pn, totHarga: _th, totDisc: _td, totRetur: _tr, ppnNilai: _pn2, ...rest } = form;
      const input = { ...rest, lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, jumlah: l.jumlah, bonus: l.bonus, harga: l.harga, satuan: l.satuanId, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, discNilai: l.discNilai, expired: l.expired || null, catatan: l.catatan })) };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  async function openPickSo() {
    const d = await gql<{ salesOrderList: { rows: typeof soRows } }>(SO_LIST);
    setSoRows(d.salesOrderList.rows); setPickSo(true);
  }
  async function applySo(id: number) {
    const d = await gql<{ salesOrderById: { pelangId?: number | null; lines?: Line[] } }>(SO_BYID, { id });
    set({ salordId: id, pelangId: d.salesOrderById.pelangId ?? null, lines: (d.salesOrderById.lines ?? []).map((l) => ({ ...emptyLine(), stockId: l.stockId, jumlah: l.jumlah, harga: l.harga, discPers: l.discPers })) });
    setPickSo(false); setMsg("Baris diambil dari S/O.");
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Penjualan</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E N J U A L A N</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>(-Semua Divisi-)</option></select>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"></button>
            <button onClick={() => setMsg("Rincian Per Item — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"></button>
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
          <div className="max-h-[330px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["ID", "Gudang", "MU", "No", "Tanggal", "Pelanggan", "SO", "PO", "Kurs", "Harga Jual", "Discount", "PJK/PPN", "%PJK", "Total", "Deposit"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.gudang}</td>
                    <td className={td}>IDR</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.pelangNama}</td>
                    <td className={td}>{r.salordId}</td>
                    <td className={td}>{r.po}</td>
                    <td className={`${td} text-right`}>{r.kurs}</td>
                    <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                    <td className={`${td} text-right font-mono`}>{r.totDisc}</td>
                    <td className={td}>{r.ppnTipe ? "PJK" : "-"}</td>
                    <td className={`${td} text-right`}>{r.ppnPers}</td>
                    <td className={`${td} text-right font-mono`}>{r2(num(r.totHarga) - num(r.totDisc) - num(r.totRetur) + num(r.adj01) + num(r.adj02) + num(r.adj03) + num(r.adj04) + num(r.adj05))}</td>
                    <td className={`${td} text-right font-mono`}>{r.deposit}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={15} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_340px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={sel ?? ""} />
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Semua Data</label>
              <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>No :</span><input className="gf-3d bg-white px-2 py-[1px]" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>S/O :</span><input className="gf-3d bg-white px-2 py-[1px]" placeholder="" title="Pencarian (ketik untuk mencari)" onChange={(e) => setQ(e.target.value)} />
              <span>P/O :</span><input className="gf-3d bg-white px-2 py-[1px]" placeholder="" title="Pencarian (ketik untuk mencari)" onChange={(e) => setQ(e.target.value)} />
              <span>Pelanggan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.pelangNama ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.catatan ?? ""} />
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={belum} onChange={(e) => setBelum(e.target.checked)} /> Yang Belum Ada Pelunasan</label>
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={sudah} onChange={(e) => setSudah(e.target.checked)} /> Yang Sudah Ada Pelunasan</label>
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
          <div className="w-[1160px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Penjualan {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-2 flex gap-1">
                {TABS.map((t, i) => (
                  <button key={t} onClick={() => setTab(i)} className={`gf-3d px-3 py-[2px] text-[12px] ${tab === i ? "bg-white" : "bg-gf-menubar"}`}>{t}</button>
                ))}
              </div>

              {tab === 0 && (
                <>
                  <div className="grid grid-cols-[80px_1fr_70px_230px] gap-x-2 gap-y-1 text-[12px]">
                    <span>Pelanggan :</span>
                    <select className="gf-3d bg-white px-1 py-[2px]" value={form.pelangId ?? ""} onChange={(e) => set({ pelangId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">*** BELUM DIPILIH ***</option>{pelanggan.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                    </select>
                    <span className="text-right">Gudang :</span>
                    <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang ?? 1} onChange={(e) => set({ gudang: Number(e.target.value) })}><option value={1}>GUDANG MASTER</option></select>
                    <span>Sales :</span>
                    <div className="flex items-center gap-1">
                      <select className="gf-3d w-[160px] bg-white px-1 py-[2px]" value={form.salesId ?? ""} onChange={(e) => set({ salesId: e.target.value ? Number(e.target.value) : null })}><option value="">--pilih sales--</option></select>
                      <span className="text-[11px]">Komisi :</span>
                      <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right" value={form.salesKom ?? "0.00"} onChange={(e) => set({ salesKom: e.target.value })} />
                      <span className="text-[11px]">0.00%</span>
                    </div>
                    <span className="text-right">No :</span>
                    <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value })} />
                    <span />
                    <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                      <span>No S/O :</span><input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.salordId ?? ""} onChange={(e) => set({ salordId: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                    <span className="text-right">No P/O :</span>
                    <input className="gf-3d bg-white px-2 py-[2px]" value={form.po ?? ""} onChange={(e) => set({ po: e.target.value })} />
                    <span />
                    <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                      <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-1 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} />
                    </div>
                    <span className="text-right">MU/Kurs :</span>
                    <div className="flex items-center gap-1">
                      <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}><option value={1}>IDR</option></select>
                      <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right" value={form.kurs ?? "1.0000"} onChange={(e) => set({ kurs: e.target.value })} />
                      <span className="text-[11px]">1.0000</span><span className="text-[11px]">1.0000</span>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-1">
                    <button onClick={openPickSo} className="gf-3d flex items-center gap-1 bg-gf-menubar px-2 py-[2px] text-[11px]">
                      <span className="inline-block h-[12px] w-[12px] border border-gf-border bg-white" /> Tambah Dari SO
                    </button>
                    <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()], id: form.id })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
                    <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
                    <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel), id: form.id })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
                  </div>

                  <div className="mt-1 max-h-[240px] overflow-auto rounded-lg border border-gf-border bg-white">
                    <table className="w-full border-collapse text-[11px]">
                      <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                        {["Gudang", "Kode", "Nama", "Jumlah", "Bonus", "Retur", "@", "Harga Jual", "Disc%", "Disc%2", "Disc%3", "Nilai", "Expired", "Catatan"].map((h) => (
                          <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {(form.lines ?? []).map((l, i) => (
                          <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                            <td className={td}>1</td>
                            <td className={`${td} w-[80px]`}><input className={`${tin} w-[80px]`} value={l.stockId || ""} onChange={(e) => setLine(i, { stockId: Number(e.target.value) || 0 })} /></td>
                            <td className={td}>
                              <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                                <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                              </select>
                            </td>
                            <td className={td}><input className={`${tin} w-[54px]`} value={l.jumlah ?? ""} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                            <td className={td}><input className={`${tin} w-[50px]`} value={l.bonus ?? "0"} onChange={(e) => setLine(i, { bonus: e.target.value })} /></td>
                            <td className={td}>0</td>
                            <td className={td}>x</td>
                            <td className={td}><input className={`${tin} w-[84px] font-mono`} value={l.harga ?? ""} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                            <td className={td}><input className={`${tin} w-[42px]`} value={l.discPers ?? "0"} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                            <td className={td}><input className={`${tin} w-[42px]`} value={l.discPers2 ?? "0"} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                            <td className={td}><input className={`${tin} w-[42px]`} value={l.discPers3 ?? "0"} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                            <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                            <td className={td}><input type="date" className="w-[104px] bg-transparent" value={l.expired ?? ""} onChange={(e) => setLine(i, { expired: e.target.value })} /></td>
                            <td className={td}><input className="w-[100px] bg-transparent" value={l.catatan ?? ""} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 grid grid-cols-[480px_1fr] gap-2">
                    <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] text-[12px]">
                      <span>Discount :</span>
                      <div className="flex items-center gap-1">
                        <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={form.discNilai ?? "0"} onChange={(e) => set({ discNilai: e.target.value })} />
                        <span className="text-[11px]">0.00%</span>
                      </div>
                      <span>PJK :</span>
                      <div className="flex items-center gap-1">
                        <select className="gf-3d w-[60px] bg-white px-1 py-[2px] text-[11px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                        <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right" value={form.ppnPers ?? "0.00"} onChange={(e) => set({ ppnPers: e.target.value })} />
                      </div>
                      <span>Credit :</span>
                      <div className="flex items-center gap-1">
                        <input className="gf-3d w-[60px] bg-white px-2 py-[2px] text-right" value={form.termCrd ?? 0} onChange={(e) => set({ termCrd: Number(e.target.value) })} />
                        <span className="text-[11px]">hari</span>
                        <span className="gf-3d flex-1 bg-[#c8c8f0] px-2 py-[2px] text-[11px]">Selasa, 13 Okt 2026</span>
                      </div>
                      <span>Deposit :</span>
                      <input className="gf-3d w-[130px] bg-white px-2 py-[2px] text-right font-mono" value={form.deposit ?? "0"} onChange={(e) => set({ deposit: e.target.value })} />
                      <span>Lunas :</span>
                      <input className="gf-3d w-[130px] bg-white px-2 py-[2px] text-right font-mono" value={form.lunas ?? "0"} onChange={(e) => set({ lunas: e.target.value })} />
                      <span>Catatan :</span>
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
                    </div>
                    <div className="border border-gf-border bg-[#c8c8f0] p-2 text-[12px]">
                      <div className="flex justify-between"><span>Adjustment :</span><input className="w-[90px] bg-white px-1 text-right" value={form.adj01 ?? "0"} onChange={(e) => set({ adj01: e.target.value })} /></div>
                      <div className="flex justify-between"><span>Total Harga :</span><b className="font-mono">{totals.totHarga}</b></div>
                      <div className="flex justify-between"><span>Total Disc :</span><b className="font-mono">{totals.totDisc}</b></div>
                      <div className="flex justify-between"><span>Total Retur :</span><b className="font-mono">{totals.totRetur}</b></div>
                      <div className="flex justify-between"><span>Adjustment :</span><b className="font-mono">{totals.adj}</b></div>
                      <div className="mt-1 flex justify-between border-t border-gf-border pt-1 font-bold text-red-700"><span>T O T A L :</span><b className="font-mono">{totals.total}</b></div>
                      <div className="flex justify-between"><span>PPN :</span><b className="font-mono">{form.ppnTipe ? totals.ppn : "0.00"}</b></div>
                      <div className="flex justify-between"><span>Deposit :</span><b className="font-mono">{num(form.deposit).toFixed(2)}</b></div>
                    </div>
                  </div>
                </>
              )}

              {tab === 1 && (
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <span>Kurs :</span>
                  <input className="gf-3d w-[140px] bg-white px-2 py-[2px] text-right" value={form.kursPajak ?? "1.0000"} onChange={(e) => set({ kursPajak: e.target.value })} />
                  <span>No :</span>
                  <input className="gf-3d w-[220px] bg-white px-2 py-[2px]" value={form.noPjk ?? ""} onChange={(e) => set({ noPjk: e.target.value ? Number(e.target.value) : null })} />
                  <span>Seri :</span>
                  <input className="gf-3d w-[220px] bg-white px-2 py-[2px]" value={form.noPjkSr ?? ""} onChange={(e) => set({ noPjkSr: e.target.value ? Number(e.target.value) : null })} />
                  <span>Tanggal :</span>
                  <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={form.tglPajak ?? ""} onChange={(e) => set({ tglPajak: e.target.value })} />
                </div>
              )}

              <div className="mt-2 flex items-center gap-2 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <span className="px-3 tracking-[4px]">C R E D I T</span>
                <input className="gf-3d w-[220px] bg-black px-2 py-[2px] text-[12px] text-white" placeholder="(info batal / kredit)" onChange={() => undefined} />
                <button onClick={onSimpan} className="gf-3d ml-auto w-[220px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[220px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
              <div className="mt-1 text-[11px] text-gf-muted">{form.pelangId ? "" : "Pelanggan belum dipilih..."} · Volume : - M³ · - Ltr</div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
            </div>
          </div>
        </div>
      )}

      {pickSo && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setPickSo(false)}>
          <div className="w-[420px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[13px] font-bold">Tambah Dari SO</div>
            <div className="max-h-[300px] overflow-auto rounded-lg border border-gf-border bg-white">
              {soRows.map((x) => (
                <button key={x.id} className="block w-full px-2 py-[2px] text-left text-[12px] hover:bg-[#e8eef7]" onClick={() => applySo(x.id)}>
                  #{x.id} · S/O {x.no ?? "-"}
                </button>
              ))}
              {soRows.length === 0 && <div className="px-2 py-2 text-[12px] text-gf-muted">Tidak ada S/O.</div>}
            </div>
            <div className="mt-2 text-right"><button onClick={() => setPickSo(false)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
