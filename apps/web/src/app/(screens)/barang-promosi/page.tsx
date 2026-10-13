"use client";





import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Pencil, Plus, Trash2, X } from "lucide-react";
import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Hdr = {
  id: number; tanggal1?: string | null; tanggal2?: string | null; pukul1?: number | null; pukul2?: number | null;
  hari?: string | null; penjEcr?: boolean | null; penjCsh?: boolean | null; penjCrd?: boolean | null;
  semuaKomp?: boolean | null; divisi?: string | null; groupPel?: string | null; groupPe2?: string | null; catatan?: string | null;
};
type Level = { level: number; harga: string; discPers: string; discPers2: string; discPers3: string };
type ItemInfo = {
  stockId: number; nama?: string | null; satuanC?: string | null; hargaBeli?: string | null;
  hargaJ1?: string | null; hargaJ2?: string | null; hargaJ3?: string | null; hargaJ4?: string | null; hargaJ5?: string | null;
  disc1J1?: string | null; disc2J1?: string | null; disc3J1?: string | null; disc1J2?: string | null; disc2J2?: string | null; disc3J2?: string | null;
  disc1J3?: string | null; disc2J3?: string | null; disc3J3?: string | null; disc1J4?: string | null; disc2J4?: string | null; disc3J4?: string | null;
  disc1J5?: string | null; disc2J5?: string | null; disc3J5?: string | null;
};

const HF = `id tanggal1 tanggal2 pukul1 pukul2 hari penjEcr penjCsh penjCrd semuaKomp divisi groupPel groupPe2 catatan`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ promosiList(q:$q, limit:$limit, offset:$offset){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ promosiById(id:$id){ ${HF} } }`;
const CREATE = `mutation($input:PromosiInput!){ createPromosi(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PromosiInput!){ updatePromosi(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePromosi(id:$id) }`;
const REFS = `{ itemList(limit:500){ rows { id nama } } divisiRefList { id nama } grppelRefList { id nama } grppe2RefList { id nama } }`;
const ITEMINFO = `query($id:Int!){ promoItemInfo(stockId:$id){ stockId nama satuanC hargaBeli hargaJ1 hargaJ2 hargaJ3 hargaJ4 hargaJ5 disc1J1 disc2J1 disc3J1 disc1J2 disc2J2 disc3J2 disc1J3 disc2J3 disc3J3 disc1J4 disc2J4 disc3J4 disc1J5 disc2J5 disc3J5 } }`;
const TERAPKAN = `mutation($promosId:Int!,$stockId:Int!,$mode:String!,$levels:[PromoLevelIn!]!){ promoTerapkanItem(promosId:$promosId, stockId:$stockId, mode:$mode, levels:$levels) }`;
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu", "Libur Nas"];
const TIPE_ENTRY = ["Sales Order", "Penjualan Eceran", "Penjualan Cash/Credit", "Penjualan Antar Cabang", "Retur Penjualan Cash/Credit"];
const hhmm = (n: number | null | undefined): string => String(n ?? 0).padStart(4, "0").replace(/^(\d{2})(\d{2})$/, "$1:$2");
const toHHMM = (s: string): number => { const d = s.replace(/\D/g, "").padEnd(4, "0").slice(0, 4); return Number(d); };

const emptyLv = (n: number): Level => ({ level: n, harga: "0", discPers: "0", discPers2: "0", discPers3: "0" });
const empty = (): Hdr => ({
  id: 0, tanggal1: new Date().toISOString().slice(0, 10), tanggal2: new Date().toISOString().slice(0, 10),
  pukul1: 0, pukul2: 2359, hari: "", penjEcr: false, penjCsh: false, penjCrd: false, semuaKomp: false,
  divisi: "", groupPel: "", groupPe2: "", catatan: "",
});
const parseIds = (s?: string | null): number[] => (s ? s.split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0) : []);
const joinIds = (set: Set<number>): string => [...set].sort((a, b) => a - b).join(",");

export default function BarangPromosiPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [items, setItems] = useState<Ref[]>([]);
  const [divisiRefs, setDivisiRefs] = useState<Ref[]>([]);
  const [grpPel, setGrpPel] = useState<Ref[]>([]);
  const [grpPe2, setGrpPe2] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [tab, setTab] = useState(0);
  const [hari, setHari] = useState<Set<number>>(new Set());
  const [divSet, setDivSet] = useState<Set<number>>(new Set());
  const [gpSet, setGpSet] = useState<Set<number>>(new Set());
  const [g2Set, setG2Set] = useState<Set<number>>(new Set());
  const [teSet, setTeSet] = useState<Set<number>>(new Set());
  const [stockId, setStockId] = useState<number | null>(null);
  const [info, setInfo] = useState<ItemInfo | null>(null);
  const [modeRadio, setModeRadio] = useState<"harga" | "disc" | "discnil">("disc");
  const [lv, setLv] = useState<Level[]>([1, 2, 3, 4, 5].map(emptyLv));
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ promosiList: { total: number; rows: Hdr[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.promosiList.rows); setTotal(d.promosiList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ itemList: { rows: Ref[] }; divisiRefList: Ref[]; grppelRefList: Ref[]; grppe2RefList: Ref[] }>(REFS)
      .then((d) => { setItems(d.itemList.rows); setDivisiRefs(d.divisiRefList); setGrpPel(d.grppelRefList); setGrpPe2(d.grppe2RefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLvRow = (i: number, patch: Partial<Level>) => setLv((ls) => ls.map((l, x) => (x === i ? { ...l, ...patch } : l)));

  async function loadItem(id: number | null) {
    setStockId(id);
    if (!id) { setInfo(null); return; }
    const d = await gql<{ promoItemInfo: ItemInfo }>(ITEMINFO, { id });
    setInfo(d.promoItemInfo);
    if (d.promoItemInfo) {
      const h = [d.promoItemInfo.hargaJ1, d.promoItemInfo.hargaJ2, d.promoItemInfo.hargaJ3, d.promoItemInfo.hargaJ4, d.promoItemInfo.hargaJ5];
      const d1 = [d.promoItemInfo.disc1J1, d.promoItemInfo.disc1J2, d.promoItemInfo.disc1J3, d.promoItemInfo.disc1J4, d.promoItemInfo.disc1J5];
      const d2 = [d.promoItemInfo.disc2J1, d.promoItemInfo.disc2J2, d.promoItemInfo.disc2J3, d.promoItemInfo.disc2J4, d.promoItemInfo.disc2J5];
      const d3 = [d.promoItemInfo.disc3J1, d.promoItemInfo.disc3J2, d.promoItemInfo.disc3J3, d.promoItemInfo.disc3J4, d.promoItemInfo.disc3J5];
      setLv([1, 2, 3, 4, 5].map((n) => ({ level: n, harga: h[n - 1] ?? "0", discPers: d1[n - 1] ?? "0", discPers2: d2[n - 1] ?? "0", discPers3: d3[n - 1] ?? "0" })));
    }
  }

  async function onTambah() {
    setErr(""); setMsg(""); setMode("create"); setForm(empty()); setTab(0);
    setHari(new Set()); setDivSet(new Set()); setGpSet(new Set()); setG2Set(new Set()); setTeSet(new Set());
    setStockId(null); setInfo(null); setModeRadio("disc"); setLv([1, 2, 3, 4, 5].map(emptyLv));
  }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ promosiById: Hdr }>(BYID, { id: sel });
    const h = d.promosiById;
    setMode("edit"); setForm({ ...empty(), ...h });
    setHari(new Set([...String(h.hari ?? "").split(",")].map((x) => Number(x.trim())).filter((n) => n >= 1 && n <= 8)));
    setDivSet(new Set(parseIds(h.divisi)));
    setGpSet(new Set(parseIds(h.groupPel)));
    setG2Set(new Set(parseIds(h.groupPe2)));
    setTeSet(new Set([...(h.penjEcr ? [1] : []), ...(h.penjCsh ? [2] : []), ...(h.penjCrd ? [3] : [])]));
    setStockId(null); setInfo(null);
    setLv([1, 2, 3, 4, 5].map(emptyLv));
    setTab(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus promo id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }

  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const input = {
        tanggal1: form.tanggal1 || null, tanggal2: form.tanggal2 || null, pukul1: form.pukul1 ?? 0, pukul2: form.pukul2 ?? 2359,
        hari: joinIds(hari), penjEcr: teSet.has(1), penjCsh: teSet.has(2), penjCrd: teSet.has(3), semuaKomp: form.semuaKomp ?? false,
        divisi: joinIds(divSet), groupPel: joinIds(gpSet), groupPe2: joinIds(g2Set), catatan: form.catatan || null,
      };
      let pid = form.id;
      if (mode === "create") {
        const d = await gql<{ createPromosi: { id: number } }>(CREATE, { input });
        pid = d.createPromosi.id;
      } else {
        await gql(UPDATE, { id: form.id, input });
      }
      if (stockId) {
        await gql(TERAPKAN, { promosId: pid, stockId, mode: modeRadio, levels: lv.map((l) => ({ level: l.level, harga: l.harga || "0", discPers: l.discPers || "0", discPers2: l.discPers2 || "0", discPers3: l.discPers3 || "0" })) });
      }
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const tot = useMemo(() => {
    const grid = [
      { ket: "Harga Beli", harga: num(info?.hargaBeli), ro: true },
      ...lv.map((l, i) => ({ ket: `Harga Jual *${i + 1}`, harga: num(l.harga), ro: false })),
    ];
    return grid.map((g, i) => {
      const l = i > 0 ? lv[i - 1] : null;
      const set = l ? (1 - (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100)) * 100 : 0;
      const nilai = l ? g.harga * (1 - set / 100) : g.harga;
      return { ...g, set, nilai };
    });
  }, [lv, info]);

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Barang Promosi</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;P R O M O S I</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <Button onClick={() => { window.location.href = "/laporan"; }}><FileSpreadsheet className="h-[14px] w-[14px] text-slate-600" /></Button>
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
                {["ID", "Tanggal", "s/d", "Pukul", "Hari", "Divisi", "Group Pel", "Group Pe2", "Eceran", "Cash", "Kredit", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.tanggal1}</td>
                    <td className={td}>{r.tanggal2}</td>
                    <td className={td}>{hhmm(r.pukul1)}-{hhmm(r.pukul2)}</td>
                    <td className={td}>{[...parseIds(r.hari)].map((n) => HARI[n - 1]).join(",")}</td>
                    <td className={td}>{[...parseIds(r.divisi)].length === 0 ? "(semua)" : parseIds(r.divisi).join(",")}</td>
                    <td className={td}>{jev(r.groupPel)}</td>
                    <td className={td}>{jev(r.groupPe2)}</td>
                    <td className={td}>{r.penjEcr ? "✔" : ""}</td>
                    <td className={td}>{r.penjCsh ? "✔" : ""}</td>
                    <td className={td}>{r.penjCrd ? "✔" : ""}</td>
                    <td className={td}>{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={12} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1180px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center gap-1 border-b border-gf-border bg-gf-titlebar px-2 py-1">
              {["Main", "Kelompok Pelanggan", "Lain-Lain"].map((t, i) => (
                <button key={t} onClick={() => setTab(i)} className={`gf-3d px-3 py-[2px] text-[12px] ${tab === i ? "bg-white font-bold" : "bg-gf-menubar"}`}>{t}</button>
              ))}
              <span className="ml-auto text-[11px] text-gf-muted">{mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              {tab === 0 && (
                <>
                  <div className="grid grid-cols-[180px_1fr] gap-2 text-[12px]">
                    <div className="border border-gf-border bg-white p-1">
                      <div className="mb-1 flex items-center gap-1"><span>Hari</span><input className="gf-3d w-[60px] bg-white px-1 text-[10px]" readOnly value={joinIds(hari)} /></div>
                      {HARI.map((h, i) => (
                        <label key={h} className="flex items-center gap-1 leading-[18px]">
                          <input type="checkbox" checked={hari.has(i + 1)} onChange={(e) => setHari((s) => { const n = new Set(s); if (e.target.checked) n.add(i + 1); else n.delete(i + 1); return n; })} />
                          {h}
                        </label>
                      ))}
                    </div>
                    <div>
                      <div className="grid grid-cols-[70px_1fr] items-center gap-x-2 gap-y-1">
                        <span>Tanggal :</span>
                        <div className="flex gap-1">
                          <input type="date" className="gf-3d w-[140px] bg-white px-1 py-[2px]" value={jev(form.tanggal1)} onChange={(e) => set({ tanggal1: e.target.value })} />
                          <span>-</span>
                          <input type="date" className="gf-3d w-[140px] bg-white px-1 py-[2px]" value={jev(form.tanggal2)} onChange={(e) => set({ tanggal2: e.target.value })} />
                        </div>
                        <span>Pukul :</span>
                        <div className="flex gap-1">
                          <input className="gf-3d w-[70px] bg-white px-1 py-[2px] text-center" value={hhmm(form.pukul1)} onChange={(e) => set({ pukul1: toHHMM(e.target.value) })} />
                          <span>-</span>
                          <input className="gf-3d w-[70px] bg-white px-1 py-[2px] text-center" value={hhmm(form.pukul2)} onChange={(e) => set({ pukul2: toHHMM(e.target.value) })} />
                        </div>
                        <span>Item :</span>
                        <div className="flex items-center gap-1">
                          <select className="gf-3d w-[330px] bg-white px-1 py-[2px]" value={stockId ?? ""} onChange={(e) => { void loadItem(e.target.value ? Number(e.target.value) : null); }}>
                            <option value="">(pilih item)</option>
                            {items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                          <button onClick={() => setMsg("F3 List Semua Item — gunakan combo di samping")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">F3 List Semua Item</button>
                        </div>
                      </div>
                      <div className="mt-1 grid grid-cols-[130px_1fr] items-center gap-x-2 gap-y-[2px]">
                        <label className="flex items-center gap-1"><input type="radio" name="modepromo" checked={modeRadio === "disc"} onChange={() => setModeRadio("disc")} /> Disc % :</label>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <input key={i} className="gf-3d w-[90px] bg-white px-2 py-[1px] text-right" value={jev(lv[i]?.discPers)} onChange={(e) => setLvRow(i, { discPers: e.target.value })} />
                          ))}
                        </div>
                        <label className="flex items-center gap-1"><input type="radio" name="modepromo" checked={modeRadio === "discnil"} onChange={() => setModeRadio("discnil")} /> Disc :</label>
                        <div className="flex items-center gap-1">
                          <select className="gf-3d w-[70px] bg-white px-1 py-[2px] text-[11px]"><option>IDR</option></select>
                          <input className="gf-3d w-[110px] bg-white px-2 py-[1px] text-right" value={jev(lv[0]?.discPers)} onChange={(e) => setLvRow(0, { discPers: e.target.value })} />
                          <span>/</span>
                          <input className="gf-3d w-[130px] bg-white px-2 py-[1px]" defaultValue="" placeholder="(nilai)" readOnly />
                        </div>
                        <label className="col-span-2 flex items-center gap-1"><input type="radio" name="modepromo" checked={modeRadio === "harga"} onChange={() => setModeRadio("harga")} /> Setting Harga Jual Spesial</label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 border border-gf-border bg-white">
                    <table className="w-full border-collapse text-[11px]">
                      <thead><tr className="bg-[#efefef]">
                        {["KETERANGAN", "MU", "HARGA", "SET%", "PER", "SAT", "DISC%", "DISC2%", "DISC3%", "NILAI-IDR"].map((h) => (
                          <th key={h} className="border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {tot.map((g, i) => (
                          <tr key={g.ket}>
                            <td className={td}>{g.ket} :</td>
                            <td className={td}>IDR</td>
                            <td className={td}>
                              {g.ro ? <span className="block text-right font-mono">{r2(g.harga)}</span>
                                : <input className={`${tin} w-[90px] font-mono`} value={lv[i - 1]?.harga ?? "0"} onChange={(e) => setLvRow(i - 1, { harga: e.target.value })} />}
                            </td>
                            <td className={`${td} text-right`}>{r2(g.set)}%</td>
                            <td className={td}>1</td>
                            <td className={td}>{info?.satuanC ?? "PCS"}</td>
                            {([0, 1, 2] as const).map((k) => (
                              <td key={k} className={td}>
                                {g.ro ? <span className="block text-right">0.00%</span>
                                  : <input className={`${tin} w-[60px]`} value={(k === 0 ? lv[i - 1]?.discPers : k === 1 ? lv[i - 1]?.discPers2 : lv[i - 1]?.discPers3) ?? "0"} onChange={(e) => setLvRow(i - 1, k === 0 ? { discPers: e.target.value } : k === 1 ? { discPers2: e.target.value } : { discPers3: e.target.value })} />}
                              </td>
                            ))}
                            <td className={`${td} text-right font-mono`}>{r2(g.nilai)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === 1 && (
                <div className="text-[12px]">
                  <div className="mb-1 italic text-gf-muted">Tanpa Pilihan artinya semua dipilih...</div>
                  <div className="grid grid-cols-2 gap-2">
                    {([["Group Pel", grpPel, gpSet, setGpSet], ["Group Pe2", grpPe2, g2Set, setG2Set]] as const).map(([label, refs, setS, setSetS]) => (
                      <div key={label} className="border border-gf-border bg-white">
                        <div className="border-b border-gf-border bg-gf-menubar px-1 text-[11px] font-bold">{label}</div>
                        <div className="max-h-[260px] overflow-auto p-1">
                          {refs.map((r) => (
                            <label key={r.id} className="flex items-center gap-1 leading-[18px]">
                              <input type="checkbox" checked={setS.has(r.id)} onChange={(e) => setSetS((s: Set<number>) => { const n = new Set(s); if (e.target.checked) n.add(r.id); else n.delete(r.id); return n; })} />
                              {r.nama} <span className="ml-auto text-gf-muted">{r.id}</span>
                            </label>
                          ))}
                          {refs.length === 0 && <div className="px-1 text-gf-muted">(tidak ada data)</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 2 && (
                <div className="text-[12px]">
                  <div className="mb-1 italic text-gf-muted">Tanpa Pilihan artinya semua dipilih...</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-gf-border bg-white">
                      <div className="flex border-b border-gf-border bg-gf-menubar text-[11px] font-bold"><span className="flex-1 px-1">Divisi</span><span className="w-[60px] px-1">ID</span></div>
                      <div className="max-h-[260px] overflow-auto p-1">
                        {divisiRefs.map((d) => (
                          <label key={d.id} className="flex items-center gap-1 leading-[18px]">
                            <input type="checkbox" checked={divSet.has(d.id)} onChange={(e) => setDivSet((s) => { const n = new Set(s); if (e.target.checked) n.add(d.id); else n.delete(d.id); return n; })} />
                            <span className="flex-1">{d.nama}</span><span className="w-[60px] text-gf-muted">{d.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="border border-gf-border bg-white">
                      <div className="border-b border-gf-border bg-gf-menubar px-1 text-[11px] font-bold">Tipe Entry</div>
                      <div className="p-1">
                        {TIPE_ENTRY.map((t, i) => (
                          <label key={t} className="flex items-center gap-1 leading-[18px]">
                            <input type="checkbox" checked={teSet.has(i + 1)} onChange={(e) => setTeSet((s) => { const n = new Set(s); if (e.target.checked) n.add(i + 1); else n.delete(i + 1); return n; })} />
                            {t}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span>Catatan :</span>
                <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
              </div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={onSimpan} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
                <span className="ml-2 text-[11px] text-gf-muted">{!stockId ? "Item Kode/Nama belum diisi !" : `Item: ${info?.nama ?? stockId}`}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
