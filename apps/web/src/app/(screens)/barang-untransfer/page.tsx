"use client";





import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ListTree, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = { stockId: number; stockNama?: string | null; stockGdg?: number | null; jumlah?: string | null; hpp?: string | null; catatan?: string | null };
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; pukul?: number | null; divisiId?: number | null;
  stockId?: number | null; stockNama?: string | null; gudang?: number | null; jumlah?: string | null; hpp?: string | null;
  nilai1?: string | null; nilai2?: string | null; nilai3?: string | null;
  perkir1?: number | null; perkir2?: number | null; perkir3?: number | null;
  catatan?: string | null; catatan2?: string | null; catatan3?: string | null; catatan4?: string | null;
  totHarga?: string | null; totJumlah?: string | null; lines?: Line[];
};

const LF = `stockId stockNama stockGdg jumlah hpp catatan`;
const HF = `id no tanggal divisiId stockId stockNama gudang jumlah hpp nilai1 nilai2 nilai3 perkir1 perkir2 perkir3 catatan catatan2 catatan3 catatan4 totHarga totJumlah`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ barangTransferList(q:$q, limit:$limit, offset:$offset){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ barangTransferById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:BarangTransferInput!){ createBarangTransfer(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:BarangTransferInput!){ updateBarangTransfer(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteBarangTransfer(id:$id) }`;
const REFS = `{ itemList(limit:500){ rows { id nama } } divisiRefList { id nama } perkiraanRefList { id nama } }`;
const SISA = `query($id:Int!){ trfSisaStock(stockId:$id){ stockId nama sisa } }`;
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", hpp: "0", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), divisiId: null, stockId: null, gudang: 1, jumlah: "0", hpp: "0",
  nilai1: "0", nilai2: "0", nilai3: "0", perkir1: null, perkir2: null, perkir3: null,
  catatan: "", catatan2: "", catatan3: "", catatan4: "", lines: [emptyLine()],
});

export default function BarangTransferPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [items, setItems] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [perkir, setPerkir] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [topItem, setTopItem] = useState<number | null>(null);
  const [sisa, setSisa] = useState<string | null>(null);
  const [lsel, setLsel] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ barangTransferList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 15, offset: (page - 1) * 15 });
    setRows(d.barangTransferList.rows); setTotal(d.barangTransferList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ itemList: { rows: Ref[] }; divisiRefList: Ref[]; perkiraanRefList: Ref[] }>(REFS)
      .then((d) => { setItems(d.itemList.rows); setDivisi(d.divisiRefList); setPerkir(d.perkiraanRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  async function pickTopItem(id: number | null) {
    setTopItem(id);
    if (!id) { setSisa(null); return; }
    const d = await gql<{ trfSisaStock: { nama?: string | null; sisa?: string | null } | null }>(SISA, { id });
    setSisa(d.trfSisaStock?.sisa ?? null);
  }

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setTopItem(null); setSisa(null); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ barangTransferById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm({ ...empty(), ...d.barangTransferById, lines: d.barangTransferById.lines ?? [] }); setTopItem(null); setSisa(null); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus barang transfer id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    if ((form.lines ?? []).length === 0 || num(form.lines?.[0]?.jumlah) === 0) return setErr("Jumlah belum diisi !");
    try {
      const input = {
        no: form.no || null, tanggal: form.tanggal || null, divisiId: form.divisiId ?? null,
        stockId: form.stockId ?? null, gudang: form.gudang ?? 1, jumlah: form.jumlah || "0", hpp: form.hpp || "0",
        nilai1: form.nilai1 || "0", nilai2: form.nilai2 || "0", nilai3: form.nilai3 || "0",
        perkir1: form.perkir1 ?? null, perkir2: form.perkir2 ?? null, perkir3: form.perkir3 ?? null,
        catatan: form.catatan || null, catatan2: form.catatan2 || null, catatan3: form.catatan3 || null, catatan4: form.catatan4 || null,
        lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, stockGdg: l.stockGdg ?? null, jumlah: l.jumlah || "0", hpp: l.hpp || "0", catatan: l.catatan || null })),
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  function hpPukulRata() {
    setForm((f) => {
      if (!f) return f;
      const totalNilai = num(f.nilai1) + num(f.nilai2) + num(f.nilai3);
      const lines = f.lines ?? [];
      const totQty = lines.reduce((s, l) => s + num(l.jumlah), 0);
      if (totQty <= 0 || totalNilai <= 0) return { ...f, lines: lines.map((l) => ({ ...l, harga: "0" })) };
      const perUnit = Math.round((totalNilai / totQty) * 100) / 100;
      return { ...f, lines: lines.map((l) => ({ ...l, harga: r2(perUnit) })) };
    });
    setMsg("HP Pukul Rata: harga per unit = (Nilai 1+2+3) / total jumlah.");
  }

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    const qty = lines.reduce((s, l) => s + num(l.jumlah), 0);
    const nilai = lines.reduce((s, l) => s + num(l.jumlah) * num(l.hpp), 0);
    return { qty: String(qty), nilai: r2(nilai) };
  }, [form]);

  async function navStep(dir: number) {
    if (!form) return;
    const asc = [...rows].sort((a, b) => a.id - b.id);
    const idx = asc.findIndex((r) => r.id === form.id);
    if (idx < 0) return;
    const t = (idx + dir + asc.length) % asc.length;
    const d = await gql<{ barangTransferById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.barangTransferById, lines: d.barangTransferById.lines ?? [] }); setLsel(0);
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Barang UnTransfer</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;T R A N S F E R</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <Button onClick={() => { window.location.href = "/laporan"; }}><FileSpreadsheet className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button onClick={() => setMsg("Rincian Per Item — menyusul")}><ListTree className="h-[14px] w-[14px] text-slate-600" /></Button>
            <button onClick={() => setMsg("Template — menyusul")} className="gf-3d bg-gf-menubar px-3 py-[10px] text-[11px]">Template</button>
            <Button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")}><Printer className="h-[14px] w-[14px] text-slate-600" /></Button>
            <Button onClick={() => setMsg("Cetak — gunakan layar Laporan")}><Printer className="h-[14px] w-[14px] text-slate-600" /></Button>
            <input className="h-[30px] min-w-0 flex-1 rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={onTambah}><Plus className="h-[14px] w-[14px] text-emerald-600" /></Button>
            <Button onClick={onKoreksi}><Pencil className="h-[14px] w-[14px] text-sky-600" /></Button>
            <Button onClick={onHapus}><Trash2 className="h-[14px] w-[14px] text-red-600" /></Button>
            <Button onClick={() => { window.location.href = "/"; }}><X className="h-[14px] w-[14px] text-slate-500" /></Button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[280px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["ID", "No", "Tanggal", "Divisi", "Gudang", "Nilai *1", "Nilai *2", "Nilai *3", "Total", "Jumlah", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? r.divisiId ?? ""}</td>
                    <td className={td}>{r.gudang}</td>
                    <td className={`${td} text-right font-mono`}>{r.nilai1}</td>
                    <td className={`${td} text-right font-mono`}>{r.nilai2}</td>
                    <td className={`${td} text-right font-mono`}>{r.nilai3}</td>
                    <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                    <td className={`${td} text-right font-mono`}>{r.totJumlah}</td>
                    <td className={td}>{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={11} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1130px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Barang UnTransfer {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[1fr_230px] gap-2">
                <div className="grid grid-cols-[70px_1fr_90px_150px] items-center gap-x-2 gap-y-1 text-[12px]">
                  <span>Divisi :</span>
                  <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                  <span>Tanggal :</span>
                  <input type="date" className="gf-3d bg-white px-1 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                  <span>Gudang :</span>
                  <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang ?? 1} onChange={(e) => set({ gudang: Number(e.target.value) })}>
                    <option value={1}>GUDANG MASTER</option>{divisi.map((d) => <option key={d.id} value={d.id}>GUDANG {d.nama.toUpperCase()}</option>)}
                  </select>
                  <span className="text-right">ID :</span>
                  <input className="gf-3d w-[100px] bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "777"} />
                  <span>Item :</span>
                  <div className="col-span-3 flex items-center gap-1">
                    <select className="gf-3d w-[330px] bg-white px-1 py-[2px]" value={form.stockId ?? ""} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : null; set({ stockId: id }); void pickTopItem(id); }}>
                      <option value="">(pilih item)</option>
                      {items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                    </select>
                    <input className="gf-3d flex-1 bg-[#2a2a2a] px-2 py-[2px] text-white" value={form.stockId ? (items.find((x) => x.id === form.stockId)?.nama ?? "") : ""} readOnly placeholder="(F3 / pilih item)" />
                  </div>
                  <span>Jumlah :</span>
                  <input className="gf-3d w-[110px] bg-white px-2 py-[2px] text-right" value={form.jumlah ?? "0"} onChange={(e) => set({ jumlah: e.target.value })} />
                  <span className="text-right">Sisa Stock :</span>
                  <input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={form.stockId ? (sisa ?? "TIDAK DIHITUNG") : "TIDAK DIHITUNG"} />
                  <span>Catatan :</span>
                  <input className="gf-3d col-span-3 bg-white px-2 py-[1px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
                  <span />
                  <input className="gf-3d col-span-3 bg-white px-2 py-[1px]" value={jev(form.catatan2)} onChange={(e) => set({ catatan2: e.target.value })} />
                  <span />
                  <input className="gf-3d col-span-3 bg-white px-2 py-[1px]" value={jev(form.catatan3)} onChange={(e) => set({ catatan3: e.target.value })} />
                  <span />
                  <input className="gf-3d col-span-3 bg-white px-2 py-[1px]" value={jev(form.catatan4)} onChange={(e) => set({ catatan4: e.target.value })} />
                </div>
                <div className="flex flex-col items-center gap-1 border border-gf-border bg-[#f4f4f4] p-1">
                  <div className="grid grid-cols-2 gap-1">
                    <button onClick={() => navStep(-2)} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{"<<"}</button>
                    <button onClick={() => navStep(-1)} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{"<"}</button>
                    <button onClick={() => navStep(1)} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{">"}</button>
                    <button onClick={() => navStep(2)} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{">>"}</button>
                  </div>
                  <button onClick={() => setMsg("Template — menyusul")} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Template</button>
                  <button onClick={hpPukulRata} className="gf-3d bg-[#ffe9a8] px-4 py-[6px] text-[16px]" title="HP Pukul Rata">⭐</button>
                </div>
              </div>

              <div className="mt-2 bg-[#8899dd] px-2 py-[2px] text-center text-[11px] font-bold text-white">Item/Stock yang bertambah</div>
              <div className="max-h-[180px] overflow-auto rounded-lg border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    {["G..", "Kode", "Nama", "Jumlah", "HPP%", "Catatan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={`${td} w-[30px]`}>{i + 1}</td>
                        <td className={`${td} w-[70px]`}>{l.stockId}</td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[70px]`} value={jev(l.jumlah)} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={`${td} text-right`}>0.00%</td>
                        <td className={td}><input className={`${tin} w-[140px] text-left`} value={jev(l.catatan)} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-1 flex gap-1">
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()] })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel) })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
                <button onClick={hpPukulRata} className="gf-3d ml-auto bg-[#ff8c00] px-4 py-[2px] text-[11px] text-white">HP Pukul Rata</button>
              </div>

              <div className="mt-2 border border-gf-border bg-[#f4f4f4] p-2">
                <div className="mb-1 text-[11px] font-bold">Tambahan Cost/Biaya dari :</div>
                {([["nilai1", "perkir1"], ["nilai2", "perkir2"], ["nilai3", "perkir3"]] as const).map(([nk, pk], i) => (
                  <div key={nk} className="mb-1 grid grid-cols-[70px_170px_110px_110px_110px] items-center gap-1 text-[12px]">
                    <span>#Acc *{i + 1} :</span>
                    <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={(form[pk as keyof Hdr] as number | null) ?? ""} onChange={(e) => set({ [pk]: e.target.value ? Number(e.target.value) : null } as Partial<Hdr>)}>
                      <option value="">.</option>{perkir.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                    <input className="gf-3d bg-white px-2 py-[2px] text-right font-mono" value={jev(form[nk as keyof Hdr] as string | null)} onChange={(e) => set({ [nk]: e.target.value } as Partial<Hdr>)} />
                    <input className="gf-3d bg-white px-2 py-[2px] text-right" defaultValue="0.00" readOnly />
                    <input className="gf-3d bg-white px-2 py-[2px] text-right" defaultValue="0.0000" readOnly />
                  </div>
                ))}
                <div className="text-right text-[11px]">Total Nilai: <b className="font-mono">{totals.nilai}</b> · Total Jumlah: <b className="font-mono">{totals.qty}</b></div>
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={onSimpan} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
                <span className="ml-2 text-[11px] text-gf-muted">{num(form.lines?.[0]?.jumlah) === 0 ? "Jumlah belum diisi !" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
