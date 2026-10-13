"use client";





import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ListTree, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  penjuaId?: number | null; penjuaNo?: string | null; penjuaTanggal?: string | null; penjuaTotal?: string | null;
  invpenId?: number | null; retpenId?: number | null; retpenNo?: string | null; dcnpiuId?: number | null; deppenId?: number | null;
  lunas?: string | null; discount?: string | null; denda?: string | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; pelangId?: number | null; pelangNama?: string | null;
  divisiId?: number | null; collector?: number | null; alsBatal?: string | null; catatan?: string | null;
  total?: string | null; totalLunas?: string | null; totalDisc?: string | null; totalDenda?: string | null; lines?: Line[];
};
type Piutang = { id: number; no?: string | null; tanggal?: string | null; pelangId?: number | null; pelangNama?: string | null; total?: string | null; dibayar?: string | null; retur?: string | null; sisa?: string | null };

const LF = `penjuaId penjuaNo penjuaTanggal penjuaTotal invpenId retpenId retpenNo dcnpiuId deppenId lunas discount denda catatan`;
const HF = `id no tanggal pelangId pelangNama divisiId collector alsBatal catatan total totalLunas totalDisc totalDenda`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ receiptList(q:$q, limit:$limit, offset:$offset){ total rows { id no tanggal pelangNama total } } }`;
const BYID = `query($id:Int!){ receiptById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:ReceiptInput!){ createReceipt(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:ReceiptInput!){ updateReceipt(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteReceipt(id:$id) }`;
const REFS = `{ pelangganRefList { id nama } divisiRefList { id nama } }`;
const PIUTANG = `query{ daftarPiutangList(limit:300){ rows { id no tanggal pelangId pelangNama total dibayar retur sisa } } }`;
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
const emptyLine = (): Line => ({ penjuaId: null, lunas: "0", discount: "0", denda: "0", catatan: "" });
const empty = (): Hdr => ({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), pelangId: null, divisiId: null, collector: null, catatan: "", lines: [] });

export default function PenerimaanPiutangPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [pel, setPel] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [piutang, setPiutang] = useState<Piutang[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ receiptList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.receiptList.rows); setTotal(d.receiptList.total);
  }, [q, page]);
  const loadPiutang = useCallback(async () => {
    const d = await gql<{ daftarPiutangList: { rows: Piutang[] } }>(PIUTANG);
    setPiutang(d.daftarPiutangList.rows);
  }, []);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    loadPiutang().catch(() => undefined);
    gql<{ pelangganRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setPel(d.pelangganRefList); setDivisi(d.divisiRefList); }).catch(() => undefined);
  }, [load, loadPiutang]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    let lunas = 0, disc = 0, denda = 0;
    for (const l of form?.lines ?? []) { lunas += num(l.lunas); disc += num(l.discount); denda += num(l.denda); }
    return { lunas: r2(lunas), disc: r2(disc), denda: r2(denda), bayar: r2(lunas - disc + denda) };
  }, [form]);

  const tagihanTampil = useMemo(
    () => piutang.filter((p) => (form?.pelangId ? p.pelangId === form.pelangId : true) && num(p.sisa) > 0),
    [piutang, form?.pelangId],
  );

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ receiptById: Hdr }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.receiptById, lines: d.receiptById.lines ?? [] }); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus penerimaan piutang id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.pelangId) return setErr("Pelanggan wajib dipilih.");
    if ((form.lines ?? []).length === 0) return setErr("Minimal 1 nota.");
    setErr("");
    try {
      const input = {
        no: form.no || null, tanggal: form.tanggal || null, pelangId: form.pelangId,
        divisiId: form.divisiId ?? null, collector: form.collector ?? null, alsBatal: form.alsBatal || null, catatan: form.catatan || null,
        lines: (form.lines ?? []).map((l) => ({
          penjuaId: l.penjuaId ?? null, invpenId: l.invpenId ?? null, retpenId: l.retpenId ?? null,
          dcnpiuId: l.dcnpiuId ?? null, deppenId: l.deppenId ?? null,
          lunas: l.lunas || "0", discount: l.discount || "0", denda: l.denda || "0", catatan: l.catatan || null,
        })),
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load(); await loadPiutang();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  function tambahDariTagihan(p: Piutang) {
    setForm((f) => (f ? {
      ...f,
      lines: [...(f.lines ?? []), { ...emptyLine(), penjuaId: p.id, penjuaNo: p.no, penjuaTanggal: p.tanggal, penjuaTotal: p.total, lunas: p.sisa ?? "0" }],
    } : f));
    setMsg(`+ Nota ${p.no} (sisa ${p.sisa})`);
  }
  function tambahDariList() {
    if (tagihanTampil.length === 0) return setMsg("Tidak ada tagihan untuk pelanggan ini.");
    setForm((f) => (f ? {
      ...f,
      lines: [...(f.lines ?? []), ...tagihanTampil.map((p) => ({ ...emptyLine(), penjuaId: p.id, penjuaNo: p.no, penjuaTanggal: p.tanggal, penjuaTotal: p.total, lunas: p.sisa ?? "0" }))],
    } : f));
    setMsg(`+ ${tagihanTampil.length} nota dari List`);
  }

  async function navTo(step: "first" | "prev" | "next" | "last") {
    if (!form) return;
    const asc = [...rows].sort((x, y) => x.id - y.id);
    const idx = asc.findIndex((r) => r.id === form.id);
    if (idx < 0) return;
    const t = step === "first" ? 0 : step === "last" ? asc.length - 1 : step === "prev" ? Math.max(0, idx - 1) : Math.min(asc.length - 1, idx + 1);
    const d = await gql<{ receiptById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.receiptById, lines: d.receiptById.lines ?? [] }); setLsel(0);
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Penerimaan Piutang</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E N E R I M A A N&nbsp;&nbsp;P I U T A N G</span>
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
          <div className="max-h-[300px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["ID", "No", "Tanggal", "Pelanggan", "Collector", "Total Bayar", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.pelangNama}</td>
                    <td className={td}>{r.collector ?? ""}</td>
                    <td className={`${td} text-right font-mono`}>{r.total}</td>
                    <td className={td}>{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1180px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Penerimaan Piutang — {mode === "create" ? "Tambah" : `Koreksi #${form.id}`}</div>
            <div className="flex items-center gap-2 border-b border-gf-border px-3 py-1 text-[11px] text-gf-muted">
              <span>...</span>
            </div>
            <div className="grid grid-cols-[480px_1fr] gap-x-4 p-3 text-[12px]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-[100px] shrink-0">Divisi :</span>
                  <select className="gf-3d w-[250px] bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">(-Semua Divisi-)</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[100px] shrink-0">No :</span>
                  <input className="gf-3d w-[80px] bg-white px-2 py-[2px]" value={jev(form.no)} onChange={(e) => set({ no: e.target.value })} placeholder="(auto)" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[100px] shrink-0">Tanggal :</span>
                  <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[100px] shrink-0">Pelanggan :</span>
                  <select className="gf-3d w-full bg-white px-1 py-[2px]" value={form.pelangId ?? ""} onChange={(e) => set({ pelangId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">*** BELUM DIPILIH ***</option>{pel.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[100px] shrink-0">Collector :</span>
                  <input className="gf-3d w-[120px] bg-white px-2 py-[2px]" value={form.collector ?? ""} onChange={(e) => set({ collector: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[100px] shrink-0">Catatan :</span>
                  <input className="gf-3d w-full bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
                </div>
              </div>
              <div className="flex h-[196px] flex-col border border-gf-border bg-white">
                <div className="flex items-center gap-1 border-b border-gf-border bg-gf-menubar px-1 py-[2px] text-[11px]">
                  <span>Daftar Tagihan (belum lunas)</span>
                  <button onClick={loadPiutang} className="gf-3d ml-auto bg-gf-menubar px-2 text-[10px]">Muat Ulang</button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="sticky top-0"><tr className="bg-[#efefef]">
                      {["No", "Tanggal", "Pelanggan", "Total", "Dibayar", "Sisa"].map((h) => (
                        <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {tagihanTampil.map((p) => (
                        <tr key={p.id} onDoubleClick={() => tambahDariTagihan(p)} className="cursor-pointer hover:bg-[#e8eef7]" title="Double-click: tambah ke penerimaan">
                          <td className={td}>{p.no}</td>
                          <td className={td}>{p.tanggal}</td>
                          <td className={td}>{p.pelangNama}</td>
                          <td className={`${td} text-right font-mono`}>{p.total}</td>
                          <td className={`${td} text-right font-mono`}>{p.dibayar}</td>
                          <td className={`${td} text-right font-mono font-bold text-red-700`}>{p.sisa}</td>
                        </tr>
                      ))}
                      {tagihanTampil.length === 0 && <tr><td colSpan={6} className="px-2 py-3 text-center text-gf-muted">Tidak ada tagihan belum lunas{form.pelangId ? " untuk pelanggan ini" : ""}.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-3">
              <div className="max-h-[220px] overflow-auto rounded-lg border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    {["No", "No Faktur", "Tgl Faktur", "Jumlah Nota", "Lunas", "Disc", "Denda", "Keterangan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} onDoubleClick={() => setForm((f) => (f ? { ...f, lines: (f.lines ?? []).filter((_, x) => x !== i) } : f))} className={`cursor-pointer ${lsel === i ? "bg-[#e8eef7]" : ""}`} title="Double-click: hapus baris">
                        <td className={td}>{i + 1}</td>
                        <td className={td}>{l.penjuaNo ?? (l.penjuaId ? `#${l.penjuaId}` : "")}{l.retpenNo ? ` (RJ ${l.retpenNo})` : ""}</td>
                        <td className={td}>{l.penjuaTanggal ?? ""}</td>
                        <td className={`${td} text-right font-mono`}>{l.penjuaTotal ?? ""}</td>
                        <td className={td}><input className={`${tin} w-[90px] font-mono`} value={jev(l.lunas)} onChange={(e) => setLine(i, { lunas: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[70px] font-mono`} value={jev(l.discount)} onChange={(e) => setLine(i, { discount: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[70px] font-mono`} value={jev(l.denda)} onChange={(e) => setLine(i, { denda: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[110px] text-left`} value={jev(l.catatan)} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                    {(form.lines ?? []).length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada nota. Double-click tagihan di kanan, atau pakai tombol di bawah.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3 pt-2">
              <button onClick={() => setMsg("Scan — hubungkan barcode scanner (menyusul)")} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Scan</button>
              <button onClick={tambahDariList} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah dari List</button>
              <button onClick={() => { if (tagihanTampil[0]) tambahDariTagihan(tagihanTampil[0]); }} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah dari Daftar Tagihan</button>
              <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()] })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Tambah</button>
              <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Koreksi</button>
              <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel) })} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Hapus</button>
              <button onClick={() => { const v = prompt("Discount (Rp) untuk baris terpilih:", jev((form.lines ?? [])[lsel]?.discount)); if (v !== null) setLine(lsel, { discount: v }); }} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[11px]">Disc</button>
            </div>

            <div className="grid grid-cols-[1fr_360px] gap-3 px-3 pt-2 text-[12px]">
              <div className="grid grid-cols-[110px_1fr_110px_1fr] items-center gap-x-2 gap-y-[3px]">
                <span>Alasan Batal :</span>
                <input className="gf-3d col-span-3 bg-white px-2 py-[1px]" value={jev(form.alsBatal)} onChange={(e) => set({ alsBatal: e.target.value })} />
              </div>
              <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[12px]">
                <div className="flex justify-between"><span>Total Lunas :</span><b className="font-mono">{totals.lunas}</b></div>
                <div className="flex justify-between"><span>Total Disc :</span><b className="font-mono">{totals.disc}</b></div>
                <div className="flex justify-between"><span>Total Denda :</span><b className="font-mono">{totals.denda}</b></div>
                <div className="mt-1 flex justify-between border-t border-gf-border pt-1 font-bold text-red-700"><span>TOTAL TERIMA :</span><b className="font-mono">{totals.bayar}</b></div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1 border-t border-gf-border p-2">
              {["<<", "<", ">", ">>"].map((t) => (
                <button key={t} onClick={() => navTo(t === "<<" ? "first" : t === "<" ? "prev" : t === ">" ? "next" : "last")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{t}</button>
              ))}
              <button onClick={onSimpan} className="gf-3d ml-auto w-[500px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
              <button onClick={() => setForm(null)} className="gf-3d w-[500px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
            </div>
            {err && <div className="px-3 pb-2 text-[12px] text-red-700">{err}</div>}
            {msg && !err && <div className="px-3 pb-2 text-[11px] text-gf-muted">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
