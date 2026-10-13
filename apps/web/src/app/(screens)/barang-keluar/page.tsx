"use client";





import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ListTree, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = { stockId: number; stockNama?: string | null; satuan?: string | null; jumlah?: string | null; hpp?: string | null; catatan?: string | null };
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; divisiId?: number | null; gudang?: number | null;
  perkirId?: number | null; perkirNama?: string | null; grpsmkId?: number | null; grpsmkNama?: string | null;
  catatan?: string | null; totalQty?: string | null; totalHpp?: string | null; lines?: Line[];
};
type Grpsmk = { id: number; nama?: string | null; stkMasuk?: boolean | null; stkKeluar?: boolean | null };

const LF = `stockId stockNama satuan jumlah hpp catatan`;
const HF = `id no tanggal divisiId gudang perkirId perkirNama grpsmkId grpsmkNama catatan totalQty totalHpp`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ barangKeluarList(q:$q, limit:$limit, offset:$offset){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ barangKeluarById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:BarangKeluarInput!){ createBarangKeluar(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:BarangKeluarInput!){ updateBarangKeluar(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteBarangKeluar(id:$id) }`;
const REFS = `{ itemList(limit:500){ rows { id nama } } divisiRefList { id nama } perkiraanRefList { id nama } grpsmkRefList { id nama stkMasuk stkKeluar } }`;
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const rp = (v: unknown): string => Number(v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", hpp: "0", catatan: "" });
const empty = (): Hdr => ({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), divisiId: null, gudang: 1, catatan: "", lines: [emptyLine()] });

export default function BarangMasukPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [items, setItems] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [perks, setPerks] = useState<Ref[]>([]);
  const [grpsmk, setGrpsmk] = useState<Grpsmk[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ barangKeluarList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.barangKeluarList.rows); setTotal(d.barangKeluarList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ itemList: { rows: Ref[] }; divisiRefList: Ref[]; perkiraanRefList: Ref[]; grpsmkRefList: Grpsmk[] }>(REFS)
      .then((d) => { setItems(d.itemList.rows); setDivisi(d.divisiRefList); setPerks(d.perkiraanRefList); setGrpsmk(d.grpsmkRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ barangKeluarById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm({ ...empty(), ...d.barangKeluarById, lines: d.barangKeluarById.lines ?? [] }); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus barang masuk id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if ((form.lines ?? []).length === 0) return setErr("Minimal 1 baris barang.");
    setErr("");
    try {
      const input = {
        no: form.no || null, tanggal: form.tanggal || null, divisiId: form.divisiId ?? null, gudang: form.gudang ?? 1,
        perkirId: form.perkirId ?? null, grpsmkId: form.grpsmkId ?? null, catatan: form.catatan || null,
        lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, jumlah: l.jumlah || "0", satuan: l.satuan ? Number(l.satuan) : null, hpp: l.hpp || "0", catatan: l.catatan || null })),
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  async function navStep(dir: number) {
    if (!form) return;
    const asc = [...rows].sort((a, b) => a.id - b.id);
    const idx = asc.findIndex((r) => r.id === form.id);
    if (idx < 0) return;
    const t = (idx + dir + asc.length) % asc.length;
    const d = await gql<{ barangKeluarById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.barangKeluarById, lines: d.barangKeluarById.lines ?? [] }); setLsel(0);
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Barang Keluar Lainnya</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;M A S U K</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <Button onClick={() => { window.location.href = "/laporan"; }}><FileSpreadsheet className="h-[14px] w-[14px] text-slate-600" /></Button>
            <button onClick={() => setMsg("Kelompok — gunakan combo Grouping di form")} className="gf-3d bg-gf-menubar px-3 py-[10px] text-[11px]">Kelompok</button>
            <Button onClick={() => setMsg("Rincian Per Item — menyusul")}><ListTree className="h-[14px] w-[14px] text-slate-600" /></Button>
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
          <div className="max-h-[300px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["ID", "No", "Tanggal", "Gudang", "Grouping", "Qty", "Harga Pokok", "CR #Acc", "Catatan", "Divisi"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.gudang}</td>
                    <td className={td}>{r.grpsmkNama}</td>
                    <td className={`${td} text-right font-mono`}>{r.totalQty}</td>
                    <td className={`${td} text-right font-mono`}>{rp(r.totalHpp)}</td>
                    <td className={td}>{r.perkirNama}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? ""}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={10} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
          <div className="mt-1 text-[10.5px] text-slate-400">· relasi: perkir_id → s_perkir, grpsmk_id → s_grpsmk, baris: s_stkmex (stock_id/hpp)</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1150px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Barang Keluar Lainnya {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 flex gap-1">
                {(["<<", "<", ">", ">>"] as const).map((t, i) => (
                  <button key={t} onClick={() => navStep([-2, -1, 1, 2][i])} className="gf-3d w-[220px] bg-gf-menubar py-[3px] text-[12px]">{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-[90px_1fr_80px_90px_100px_90px] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Tanggal :</span>
                <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                <span className="text-right">No :</span>
                <input className="gf-3d w-[70px] bg-white px-2 py-[2px]" value={jev(form.no)} onChange={(e) => set({ no: e.target.value })} placeholder="(auto)" />
                <span className="text-right">Gudang :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang ?? 1} onChange={(e) => set({ gudang: Number(e.target.value) })}>
                  <option value={1}>GUDANG MASTER</option>{divisi.map((d) => <option key={d.id} value={d.id}>GUDANG {d.nama.toUpperCase()}</option>)}
                </select>
                <span>Grouping :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.grpsmkId ?? ""} onChange={(e) => set({ grpsmkId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{grpsmk.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
                <span className="text-right">CR #Acc :</span>
                <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={form.perkirId ?? ""} onChange={(e) => set({ perkirId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{perks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
                <span>Divisi :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span className="text-right">ID :</span>
                <input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "(auto)"} />
              </div>

              <div className="mt-2 max-h-[220px] overflow-auto rounded-lg border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    {["No", "Gdg", "Kode", "Nama", "Jumlah", "Harga Pokok", "Catatan", "Item-ID"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>{i + 1}</td>
                        <td className={`${td} w-[50px]`}>{form.gudang}</td>
                        <td className={`${td} w-[70px]`}>{l.stockId}</td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[70px]`} value={jev(l.jumlah)} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[100px] font-mono`} value={jev(l.hpp)} onChange={(e) => setLine(i, { hpp: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[140px] text-left`} value={jev(l.catatan)} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                        <td className={td}>{l.stockId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-1 flex gap-1">
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()] })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel) })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span>Catatan :</span>
                <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
              </div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Lookup item — gunakan combo Nama baris")} className="gf-3d bg-gf-menubar px-2 py-[3px] text-[12px]">{"<>"}</button>
                <button onClick={onSimpan} className="gf-3d w-[430px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[430px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
