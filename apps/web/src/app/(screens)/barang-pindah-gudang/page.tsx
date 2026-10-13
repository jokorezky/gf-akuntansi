"use client";





import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ListTree, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = { stockId: number; stockNama?: string | null; stockGdg?: number | null; stockGdg2?: number | null; jumlah?: string | null; hpp?: string | null; catatan?: string | null };
type Hdr = {
  id: number; no?: number | null; tanggal?: string | null; divisiId?: number | null; nama?: string | null; alamat?: string | null;
  gudang1?: number | null; gudang2?: number | null; catatan?: string | null; totJumlah?: string | null; lines?: Line[];
};

const LF = `stockId stockNama stockGdg stockGdg2 jumlah hpp catatan`;
const HF = `id no tanggal divisiId nama alamat gudang1 gudang2 catatan totJumlah`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ barangPindahGudangList(q:$q, limit:$limit, offset:$offset){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ barangPindahGudangById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:BarangPindahGudangInput!){ createBarangPindahGudang(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:BarangPindahGudangInput!){ updateBarangPindahGudang(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteBarangPindahGudang(id:$id) }`;
const REFS = `{ itemList(limit:500){ rows { id nama } } divisiRefList { id nama } }`;
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", catatan: "" });
const empty = (): Hdr => ({ id: 0, tanggal: new Date().toISOString().slice(0, 10), divisiId: null, nama: "", alamat: "", gudang1: 1, gudang2: 1, catatan: "", lines: [] });

export default function BarangPindahGudangPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [items, setItems] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ barangPindahGudangList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.barangPindahGudangList.rows); setTotal(d.barangPindahGudangList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ itemList: { rows: Ref[] }; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setItems(d.itemList.rows); setDivisi(d.divisiRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ barangPindahGudangById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm({ ...empty(), ...d.barangPindahGudangById, lines: d.barangPindahGudangById.lines ?? [] }); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus pindah gudang id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if ((form.lines ?? []).length === 0) return setErr("Minimal 1 baris barang.");
    setErr("");
    try {
      const input = {
        no: form.no ?? null, tanggal: form.tanggal || null, divisiId: form.divisiId ?? null,
        nama: form.nama || null, alamat: form.alamat || null, gudang1: form.gudang1 ?? 1, gudang2: form.gudang2 ?? 1,
        catatan: form.catatan || null,
        lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, stockGdg: l.stockGdg ?? null, stockGdg2: l.stockGdg2 ?? null, jumlah: l.jumlah || "0", hpp: l.hpp || "0", catatan: l.catatan || null })),
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
    const d = await gql<{ barangPindahGudangById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.barangPindahGudangById, lines: d.barangPindahGudangById.lines ?? [] }); setLsel(0);
  }
  async function copyItem() {
    const l = (form?.lines ?? [])[lsel];
    if (!l) return setMsg("Pilih baris dulu.");
    const txt = JSON.stringify({ stockId: l.stockId, stockNama: l.stockNama, jumlah: l.jumlah, hpp: l.hpp, catatan: l.catatan });
    try { await navigator.clipboard.writeText(txt); } catch { /* fallback */ }
    (window as unknown as { __pgClip?: string }).__pgClip = txt;
    setMsg("Item di-copy ke clipboard.");
  }
  async function pasteItem() {
    let txt = (window as unknown as { __pgClip?: string }).__pgClip ?? "";
    if (!txt) { try { txt = await navigator.clipboard.readText(); } catch { txt = ""; } }
    if (!txt) return setMsg("Clipboard kosong.");
    try {
      const l = JSON.parse(txt) as Line;
      set({ lines: [...(form?.lines ?? []), { ...emptyLine(), ...l }] });
      setMsg("Item di-paste dari clipboard.");
    } catch { setMsg("Isi clipboard bukan item pindah gudang."); }
  }

  const gudangOf = (id?: number | null) => (id === 1 ? "GUDANG MASTER" : `GUDANG ${(divisi.find((d) => d.id === id)?.nama ?? id ?? "").toString().toUpperCase()}`);
  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Barang Pindah Gudang</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;P I N D A H&nbsp;&nbsp;G U D A N G</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <Button onClick={() => { window.location.href = "/laporan"; }}><FileSpreadsheet className="h-[14px] w-[14px] text-slate-600" /></Button>
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
                {["ID", "No", "Tanggal", "Dari", "Ke", "Catatan", "Nama", "Divisi", "Jumlah"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{gudangOf(r.gudang1)}</td>
                    <td className={td}>{gudangOf(r.gudang2)}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.nama}</td>
                    <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? ""}</td>
                    <td className={`${td} text-right font-mono`}>{r.totJumlah}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1090px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Barang Pindah Gudang {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 flex gap-1">
                {(["<<", "<", ">", ">>"] as const).map((t, i) => (
                  <button key={t} onClick={() => navStep([-2, -1, 1, 2][i])} className="gf-3d w-[200px] bg-gf-menubar py-[3px] text-[12px]">{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-[70px_1fr_70px_1fr_90px_120px] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Divisi :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span>Tanggal :</span>
                <input type="date" className="gf-3d bg-white px-1 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                <span className="text-right">ID :</span>
                <input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "777"} />
                <span>Dr Gudang :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang1 ?? 1} onChange={(e) => set({ gudang1: Number(e.target.value) })}>
                  <option value={1}>GUDANG MASTER</option>{divisi.map((d) => <option key={d.id} value={d.id}>GUDANG {d.nama.toUpperCase()}</option>)}
                </select>
                <span>Ke Gudang :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang2 ?? 1} onChange={(e) => set({ gudang2: Number(e.target.value) })}>
                  <option value={1}>GUDANG MASTER</option>{divisi.map((d) => <option key={d.id} value={d.id}>GUDANG {d.nama.toUpperCase()}</option>)}
                </select>
                <span>No :</span>
                <input className="gf-3d w-[80px] bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value ? Number(e.target.value) : null })} placeholder="(auto)" />
                <span className="text-right">Kirim Ke :</span>
                <div className="col-span-3 flex items-center gap-1">
                  <button onClick={() => setMsg("Kirim Ke — isi nama/alamat tujuan di samping")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Kirim Ke</button>
                  <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={jev(form.nama)} onChange={(e) => set({ nama: e.target.value })} placeholder="Nama tujuan..." />
                  <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={jev(form.alamat)} onChange={(e) => set({ alamat: e.target.value })} placeholder="Alamat tujuan..." />
                </div>
                <span>Catatan :</span>
                <input className="gf-3d col-span-5 bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
              </div>

              <div className="mt-2 max-h-[220px] overflow-auto rounded-lg border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    {["No", "Kode", "Nama", "Jumlah", "Catatan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>{i + 1}</td>
                        <td className={`${td} w-[70px]`}>{l.stockId}</td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[70px]`} value={jev(l.jumlah)} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[150px] text-left`} value={jev(l.catatan)} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-1 flex gap-1">
                <button onClick={() => setMsg("Scan — hubungkan barcode scanner (menyusul)")} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Scan</button>
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()] })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel) })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
                <button onClick={copyItem} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Copy Item ke Clipboard</button>
                <button onClick={pasteItem} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Paste Item dari Clipboard</button>
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Navigasi — gunakan tombol << < > >> di atas")} className="gf-3d bg-gf-menubar px-2 py-[3px] text-[12px]">{"<>"}</button>
                <button onClick={onSimpan} className="gf-3d w-[420px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[420px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
