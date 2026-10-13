"use client";


import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuan?: number | null; satuanC?: string | null;
  jumlah?: string | null; harga?: string | null; discPers?: string | null; discPers2?: string | null;
  discPers3?: string | null; discNilai?: string | null; ppnPers?: string | null; ppnNilai?: string | null;
  catatan?: string | null; alsBatal?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; pukulC?: string | null;
  pelangId?: number | null; pelNama?: string | null; gudang?: number | null; mauang?: number | null; salesId?: number | null;
  discPers?: string | null; discNilai?: string | null;
  adj1Pers?: string | null; adj2Pers?: string | null; adj3Pers?: string | null; adj4Pers?: string | null; adj5Pers?: string | null;
  adj1Nilai?: string | null; adj2Nilai?: string | null; adj3Nilai?: string | null; adj4Nilai?: string | null; adj5Nilai?: string | null;
  stsEcr?: number | null; catatan?: string | null; catatan2?: string | null; catatan3?: string | null; lines?: Line[];
};
type Kat = {
  id: number; nama?: string | null; grup?: number | null;
  hargaJ1?: string | null; hargaJ2?: string | null; hargaJ3?: string | null; hargaJ4?: string | null; hargaJ5?: string | null;
  disc1J1?: string | null; disc2J1?: string | null; disc3J1?: string | null; disc1J2?: string | null; disc2J2?: string | null; disc3J2?: string | null;
};

const LF = `stockId stockNama satuan satuanC jumlah harga discPers discPers2 discPers3 discNilai ppnPers ppnNilai catatan alsBatal`;
const HF = `id no tanggal pukulC pelangId pelNama gudang mauang stsEcr discPers discNilai adj1Pers adj2Pers adj3Pers adj4Pers adj5Pers adj1Nilai adj2Nilai adj3Nilai adj4Nilai adj5Nilai catatan subTotal totDisc totalQty total`;
const LIST = `query{ posList(limit:60){ total rows { id no tanggal pelNama total totalQty } } }`;
const BYID = `query($id:Int!){ posById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:PosInput!){ createPos(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PosInput!){ updatePos(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePos(id:$id) }`;
const KAT = `query($q:String, $limit:Int, $offset:Int){ posKatalog(q:$q, limit:$limit, offset:$offset, limit:300){ id nama grup hargaJ1 hargaJ2 hargaJ3 hargaJ4 hargaJ5 disc1J1 disc2J1 disc3J1 disc1J2 disc2J2 disc3J2 } }`;
const REFS = `{ pelangganRefList { id nama } posDivisiList { id nama } }`;

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
function lineNilai(l: Line): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", harga: "0", discPers: "0", discPers2: "0", discPers3: "0", discNilai: "0", ppnPers: "0", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), pelangId: null, gudang: 1, mauang: 1,
  discPers: "0", discNilai: "0", adj1Pers: "0", adj2Pers: "0", adj3Pers: "0", adj4Pers: "0", adj5Pers: "0",
  adj1Nilai: "0", adj2Nilai: "0", adj3Nilai: "0", adj4Nilai: "0", adj5Nilai: "0", stsEcr: 0, catatan: "", lines: [],
});
const tglPanjang = (iso?: string | null): string => {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  try {
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", weekday: "long" });
  } catch { return d.toISOString().slice(0, 10); }
};

export default function PosPage() {
  const [rows, setRows] = useState<{ id: number; no?: string | null; tanggal?: string | null; pelNama?: string | null; total?: string | null; totalQty?: string | null }[]>([]);
  const [pel, setPel] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [divisiId, setDivisiId] = useState<number | null>(null);
  const [kat, setKat] = useState<Kat[]>([]);
  const [kq, setKq] = useState("");
  const [form, setForm] = useState<Hdr>(empty());
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [hargaLevel, setHargaLevel] = useState(1);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ posList: { rows: typeof rows } }>(LIST);
    setRows(d.posList.rows);
  }, []);
  const loadKat = useCallback(async () => {
    const d = await gql<{ posKatalog: Kat[] }>(KAT, { q: kq || null });
    setKat(d.posKatalog);
  }, [kq]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ pelangganRefList: Ref[]; posDivisiList: Ref[] }>(REFS)
      .then((d) => { setPel(d.pelangganRefList); setDivisi(d.posDivisiList); }).catch(() => undefined);
  }, [load]);
  useEffect(() => { loadKat().catch(() => undefined); }, [loadKat]);

  const set = (patch: Partial<Hdr>) => setForm((f) => ({ ...f, ...patch }));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => ({ ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) }));

  const totals = useMemo(() => {
    const lines = form.lines ?? [];
    let sub = 0, qty = 0, ppn = 0;
    for (const l of lines) { sub += lineNilai(l); qty += num(l.jumlah); ppn += num(l.ppnPers) > 0 ? lineNilai(l) * num(l.ppnPers) / 100 : num(l.ppnNilai); }
    const discPersAmt = sub * num(form.discPers) / 100;
    let after = sub - discPersAmt - num(form.discNilai);
    for (let i = 1; i <= 5; i++) after = after - after * num(form[`adj${i}Pers` as keyof Hdr]) / 100 - num(form[`adj${i}Nilai` as keyof Hdr]);
    return { sub: r2(sub), qty: String(qty), total: r2(after + ppn) };
  }, [form]);

  const openRecord = useCallback(async (id: number) => {
    setErr(""); setMsg("");
    const d = await gql<{ posById: Hdr }>(BYID, { id });
    setMode("edit"); setForm({ ...empty(), ...d.posById, lines: d.posById.lines ?? [] }); setLsel(0);
  }, []);

  async function onBaru() { setErr(""); setMsg("Record Baru"); setMode("create"); setForm(empty()); setLsel(0); }
  async function onSimpan() {
    setErr("");
    if ((form.lines ?? []).length === 0) return setErr("Minimal 1 barang.");
    if (form.pelangId == null) return setErr("Pelanggan belum dipilih!");
    try {
      const input = {
        no: form.no || null, tanggal: form.tanggal || null, pelangId: form.pelangId, gudang: form.gudang ?? 1, mauang: form.mauang ?? 1,
        discPers: form.discPers || "0", discNilai: form.discNilai || "0",
        adj1Pers: form.adj1Pers || "0", adj2Pers: form.adj2Pers || "0", adj3Pers: form.adj3Pers || "0", adj4Pers: form.adj4Pers || "0", adj5Pers: form.adj5Pers || "0",
        adj1Nilai: form.adj1Nilai || "0", adj2Nilai: form.adj2Nilai || "0", adj3Nilai: form.adj3Nilai || "0", adj4Nilai: form.adj4Nilai || "0", adj5Nilai: form.adj5Nilai || "0",
        catatan: form.catatan || null,
        lines: (form.lines ?? []).map((l) => ({
          stockId: l.stockId, satuan: l.satuan ?? null, satuanC: l.satuanC ?? null, jumlah: l.jumlah || "0", harga: l.harga || "0",
          discPers: l.discPers || "0", discPers2: l.discPers2 || "0", discPers3: l.discPers3 || "0", discNilai: l.discNilai || "0",
          ppnPers: l.ppnPers || "0", ppnNilai: l.ppnNilai || "0", catatan: l.catatan || null, alsBatal: l.alsBatal || null,
        })),
      };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  async function onHapus() {
    if (mode !== "edit" || !form.id) return setMsg("Tidak ada record.");
    if (!(await confirmDialog(`Hapus nota ${form.no ?? form.id}? (soft delete)`))) return;
    await gql(DELETE, { id: form.id });
    setMsg("Terhapus."); await onBaru(); await load();
  }
  async function nav(step: "first" | "prev" | "next" | "last") {
    if (rows.length === 0) return setMsg("Belum ada nota.");
    if (mode === "create" || !form.id) {
      const id = step === "prev" || step === "last" ? rows[rows.length - 1].id : rows[0].id;
      await openRecord(id); return;
    }
    const asc = [...rows].sort((a, b) => a.id - b.id);
    const idx = asc.findIndex((r) => r.id === form.id);
    let t = idx;
    if (step === "first") t = 0;
    else if (step === "prev") t = Math.max(0, idx - 1);
    else if (step === "next") t = Math.min(asc.length - 1, idx + 1);
    else t = asc.length - 1;
    if (t >= 0 && asc[t]) await openRecord(asc[t].id);
  }

  function addFromKatalog(it: Kat) {
    const lvl = (n: number) => ({ harga: it[`hargaJ${n}` as keyof Kat] as string | null, d1: it[`disc1J${n}` as keyof Kat] as string | null, d2: it[`disc2J${n}` as keyof Kat] as string | null, d3: it[`disc3J${n}` as keyof Kat] as string | null });
    const p = lvl(hargaLevel);
    setForm((f) => ({
      ...f,
      lines: [...(f.lines ?? []), { ...emptyLine(), stockId: it.id, stockNama: it.nama ?? "", harga: p.harga ?? "0", discPers: p.d1 ?? "0", discPers2: p.d2 ?? "0", discPers3: p.d3 ?? "0" }],
    }));
    setMsg(`+ ${it.nama ?? it.id} (HJ #${hargaLevel})`);
  }

  useEffect(() => {
    const kh = (e: KeyboardEvent) => { if (e.key === "F10") { e.preventDefault(); onSimpan(); } };
    window.addEventListener("keydown", kh, true);
    return () => window.removeEventListener("keydown", kh, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";
  const activeLines = form.lines ?? [];

  return (
    <div className="min-h-full bg-gf-bg p-2 text-gf-text">
      <div className="mx-auto max-w-[1280px] border border-gf-border bg-gf-panel">
        <div className="flex items-center gap-1 border-b border-gf-border bg-gf-titlebar px-2 py-[3px]">
          <span className="text-[12px] font-bold">Penjualan - {tglPanjang(form.tanggal)}</span>
          <span className="mx-2 flex-1 truncate text-[11px] text-gf-muted">{form.pelNama ?? ""}</span>
          <button onClick={() => setMsg("Pilih pelanggan dari combo, atau tombol Pelanggan untuk cari.")} className="gf-3d bg-gf-menubar px-2 py-[1px] text-[11px]">Pelanggan</button>
          <span className="gf-3d bg-white px-2 py-[1px] text-[11px]">🔍</span>
          {([["?", "Bantuan: F10 = Simpan (F10)"], ["<<", "first"], ["<", "prev"], [">", "next"], [">>", "last"]] as const).map(([t, a]) => (
            <button key={t} onClick={() => (a.startsWith("Bantuan") ? setMsg(a) : nav(a as "first" | "prev" | "next" | "last"))} className="gf-3d bg-gf-menubar px-2 py-[1px] text-[11px]">{t}</button>
          ))}
          <button onClick={onBaru} className="gf-3d bg-gf-menubar px-2 py-[1px] text-[11px]">Baru</button>
          <button onClick={onHapus} className="gf-3d bg-gf-menubar px-2 py-[1px] text-[11px] text-red-700">Hapus</button>
        </div>

        <div className="flex items-center gap-2 px-2 py-1 text-[12px]">
          <span className={`gf-3d px-2 py-[2px] text-[11px] font-bold ${mode === "create" ? "bg-[#ffe9a8] text-green-800" : "bg-[#d8e8d8] text-blue-800"}`}>{mode === "create" ? "** BARU **" : "** KOREKSI **"}</span>
          <span>No :</span>
          <input className="gf-3d w-[200px] bg-white px-2 py-[2px]" value={jev(form.no)} onChange={(e) => set({ no: e.target.value })} placeholder="(auto)" />
          <select className="gf-3d w-[330px] bg-white px-1 py-[2px]" value={form.pelangId ?? ""} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : null; set({ pelangId: id, pelNama: pel.find((p) => p.id === id)?.nama ?? null }); }}>
            <option value="">*** BELUM DIPILIH ***</option>
            {pel.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
          </select>
          <span className="ml-auto text-[11px]">Divisi/Cabang :</span>
          <select className="gf-3d w-[180px] bg-white px-1 py-[2px]" value={divisiId ?? ""} onChange={(e) => setDivisiId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">---</option>
            {divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-[1fr_200px] gap-2 px-2">
          <div className="border border-gf-border bg-[#f4f4f4] px-2 py-1 text-[11px] leading-[18px]">
            <div className="truncate">Sub Total : <b className="font-mono">{totals.sub}</b> · Disc : <b className="font-mono">{r2(num(totals.sub) * 0 + 0)}</b> · Pajak : <b className="font-mono">-</b></div>
            <div className="truncate">Set Disc : <input className="gf-3d w-[70px] bg-white px-1 text-right" value={jev(form.discPers)} onChange={(e) => set({ discPers: e.target.value })} /> % <input className="gf-3d w-[80px] bg-white px-1 text-right" value={jev(form.discNilai)} onChange={(e) => set({ discNilai: e.target.value })} /> Rp</div>
            <div className="truncate" title="Adjustment 1-5">Adj : {[1, 2, 3, 4, 5].map((i) => (
              <input key={i} className="gf-3d mx-[2px] w-[48px] bg-white px-1 text-right" value={jev(form[`adj${i}Pers` as keyof Hdr] as string | null)} onChange={(e) => set({ [`adj${i}Pers`]: e.target.value } as Partial<Hdr>)} />
            ))}</div>
          </div>
          <div className="border border-gf-border bg-[#f4f4f4] px-2 py-1 text-right">
            <div className="text-[18px] font-bold font-mono leading-[22px] text-red-700">{totals.total}</div>
            <div className="text-[11px]">TOTAL QTY: {totals.qty}</div>
            <button onClick={onSimpan} className="gf-3d mt-1 w-full bg-[#e8e0c8] py-[2px] text-[12px] font-bold">Simpan (F10)</button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 py-1 text-[12px]">
          <span>Catatan :</span>
          <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
        </div>
        {err && <div className="px-2 text-[12px] text-red-700">{err}</div>}
        {msg && !err && <div className="px-2 text-[11px] text-gf-muted">{msg}</div>}

        <div className="grid grid-cols-[1fr_470px] gap-2 px-2 pb-2">
          <div className="max-h-[300px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                {["No", "Kode", "Nama", "Jumlah", "@", "Harga Jual", "Disc%", "Disc%2", "Disc%3", "Discount", "%PJK", "Pajak", "Nilai Jual", "Alasan Batal", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {activeLines.map((l, i) => (
                  <tr key={i} onClick={() => setLsel(i)} onDoubleClick={() => setForm((f) => ({ ...f, lines: (f.lines ?? []).filter((_, x) => x !== i) }))} className={`cursor-pointer ${lsel === i ? "bg-[#e8eef7]" : ""}`} title="Double-click: hapus baris">
                    <td className={td}>{i + 1}</td>
                    <td className={`${td} w-[56px]`}>{l.stockId}</td>
                    <td className={`${td} min-w-[150px]`}>{l.stockNama ?? ""}</td>
                    <td className={td}><input className={`${tin} w-[52px]`} value={jev(l.jumlah)} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                    <td className={td}>x</td>
                    <td className={td}><input className={`${tin} w-[78px] font-mono`} value={jev(l.harga)} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                    <td className={td}><input className={`${tin} w-[42px]`} value={jev(l.discPers)} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                    <td className={td}><input className={`${tin} w-[42px]`} value={jev(l.discPers2)} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                    <td className={td}><input className={`${tin} w-[42px]`} value={jev(l.discPers3)} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                    <td className={td}><input className={`${tin} w-[64px] font-mono`} value={jev(l.discNilai)} onChange={(e) => setLine(i, { discNilai: e.target.value })} /></td>
                    <td className={td}><input className={`${tin} w-[40px]`} value={jev(l.ppnPers)} onChange={(e) => setLine(i, { ppnPers: e.target.value })} /></td>
                    <td className={`${td} w-[64px] text-right font-mono`}>{num(l.ppnPers) > 0 ? r2(lineNilai(l) * num(l.ppnPers) / 100) : r2(num(l.ppnNilai))}</td>
                    <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                    <td className={td}><input className={`${tin} w-[70px] text-left`} value={jev(l.alsBatal)} onChange={(e) => setLine(i, { alsBatal: e.target.value })} /></td>
                    <td className={td}><input className={`${tin} w-[80px] text-left`} value={jev(l.catatan)} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                  </tr>
                ))}
                {activeLines.length === 0 && <tr><td colSpan={15} className="px-2 py-3 text-center text-gf-muted">Double-click item di katalog → masuk ke sini. (F10 Simpan)</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex h-[300px] flex-col border border-gf-border bg-white">
            <div className="flex items-center gap-1 border-b border-gf-border bg-gf-menubar px-1 py-[2px] text-[11px]">
              <span>Katalog :</span>
              <input className="gf-3d flex-1 bg-white px-2 py-[1px]" value={kq} onChange={(e) => setKq(e.target.value)} placeholder="" title="Pencarian (ketik untuk mencari)" />
              <span>HJ {hargaLevel}</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0"><tr className="bg-[#efefef]">
                  {["Kode", "Nama", `HJ #${hargaLevel}`, "D%", "D2%", "D3%", "Group"].map((h) => (
                    <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {kat.map((it) => {
                    const hj = it[`hargaJ${hargaLevel}` as keyof Kat] as string | null;
                    const d1 = it[`disc1J${hargaLevel}` as keyof Kat] as string | null;
                    const d2 = it[`disc2J${hargaLevel}` as keyof Kat] as string | null;
                    const d3 = it[`disc3J${hargaLevel}` as keyof Kat] as string | null;
                    return (
                      <tr key={it.id} onDoubleClick={() => addFromKatalog(it)} className="cursor-pointer hover:bg-[#e8eef7]" title="Double-click: tambah ke nota">
                        <td className={td}>{it.id}</td>
                        <td className={`${td} min-w-[130px]`}><button className="text-left hover:underline" onClick={() => addFromKatalog(it)}>{it.nama}</button></td>
                        <td className={`${td} text-right font-mono`}>{hj ?? "0.00"}</td>
                        <td className={td}>{d1 ?? ""}</td>
                        <td className={td}>{d2 ?? ""}</td>
                        <td className={td}>{d3 ?? ""}</td>
                        <td className={td}>{it.grup ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-gf-border px-2 py-[2px] text-[11px] text-gf-muted">
          <span>Mode Online</span><span>User: Acu&nbsp;&nbsp;PC: INDUSIAAI</span><span className="font-bold text-gf-text">HJ *</span><span>{mode === "create" ? "Record Baru" : `#${form.id}`}</span>
          <span className="ml-auto">GUDANG MASTER</span><span>IDR</span><span>GF-Akuntansi Release 951.1823</span>
        </div>

        <div className="border-t border-gf-border bg-[#f4f4f4] px-2 py-[2px] text-[11px]">
          Daftar nota terakhir: {rows.slice(0, 6).map((r) => (
            <button key={r.id} onClick={() => openRecord(r.id)} className="mr-2 text-blue-800 hover:underline">{r.no} ({r.tanggal})</button>
          ))}
        </div>
      </div>
    </div>
  );
}
