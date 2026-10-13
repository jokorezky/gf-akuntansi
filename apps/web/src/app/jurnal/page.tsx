"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = { perkirId?: number | null; perkirNama?: string | null; nilai?: string | null; debet?: boolean | null; note?: string | null; date?: string | null; mauang?: number | null };
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; divisiId?: number | null;
  vendorId?: number | null; vendorNama?: string | null; pelangId?: number | null; pelangNama?: string | null;
  jenis?: number | null; catatan?: string | null; totalDebet?: string | null; totalKredit?: string | null; lines?: Line[];
};

const LF = `perkirId perkirNama nilai debet note date mauang`;
const HF = `id no tanggal divisiId vendorId vendorNama pelangId pelangNama jenis catatan totalDebet totalKredit`;
const LIST = `query($q:String){ jurnalList(q:$q){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ jurnalById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:JurnalInput!){ createJurnal(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:JurnalInput!){ updateJurnal(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteJurnal(id:$id) }`;
const REFS = `{ perkiraanRefList { id nama } divisiRefList { id nama } vendorRefList { id nama } pelangganRefList { id nama } }`;
const ICON = "/gf-icons/screens/pembelian";

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const rp = (v: unknown): string => Number(v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const emptyLine = (debet: boolean): Line => ({ perkirId: null, nilai: "0", debet, note: "", date: "", mauang: 1 });
const empty = (): Hdr => ({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), divisiId: null, jenis: null, catatan: "", lines: [] });
const JENIS: Record<number, string> = { 1: "Jurnal Umum", 2: "Memorial", 3: "Penyesuaian", 4: "Penutup" };

export default function JurnalPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [perks, setPerks] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [pelanggans, setPelanggans] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ jurnalList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.jurnalList.rows); setTotal(d.jurnalList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ perkiraanRefList: Ref[]; divisiRefList: Ref[]; vendorRefList: Ref[]; pelangganRefList: Ref[] }>(REFS)
      .then((d) => { setPerks(d.perkiraanRefList); setDivisi(d.divisiRefList); setVendors(d.vendorRefList); setPelanggans(d.pelangganRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (idx: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === idx ? { ...l, ...patch } : l)) } : f));
  const debetLines = (form?.lines ?? []).map((l, i) => ({ l, i })).filter(({ l }) => l.debet !== false);
  const kreditLines = (form?.lines ?? []).map((l, i) => ({ l, i })).filter(({ l }) => l.debet === false);
  const totalDebet = debetLines.reduce((s, { l }) => s + num(l.nilai), 0);
  const totalKredit = kreditLines.reduce((s, { l }) => s + num(l.nilai), 0);
  const seimbang = useMemo(() => Math.abs(totalDebet - totalKredit) < 0.005, [totalDebet, totalKredit]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm({ ...empty(), lines: [emptyLine(true), emptyLine(false)] }); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ jurnalById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm({ ...empty(), ...d.jurnalById, lines: d.jurnalById.lines ?? [] });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus jurnal id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!seimbang) return setErr(`DEBET (${rp(totalDebet)}) dan KREDIT (${rp(totalKredit)}) belum seimbang!`);
    if ((form.lines ?? []).length === 0) return setErr("Minimal 1 baris.");
    setErr("");
    try {
      const input = {
        no: form.no || null, tanggal: form.tanggal || null, divisiId: form.divisiId ?? null,
        vendorId: form.vendorId ?? null, pelangId: form.pelangId ?? null, jenis: form.jenis ?? null, catatan: form.catatan || null,
        lines: (form.lines ?? []).map((l) => ({ perkirId: l.perkirId ?? null, nilai: l.nilai || "0", debet: l.debet ?? true, note: l.note || null, date: l.date || null, mauang: l.mauang ?? 1 })),
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
    const d = await gql<{ jurnalById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.jurnalById, lines: d.jurnalById.lines ?? [] });
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";
  const jev = (v: string | null | undefined) => v ?? "";

  function renderGrid(debetSide: boolean) {
    const list = debetSide ? debetLines : kreditLines;
    return (
      <div className="border border-gf-border bg-white">
        <div className={`px-2 py-[1px] text-center text-[11px] font-bold text-white ${debetSide ? "bg-[#88aa88]" : "bg-[#8899dd]"}`}>{debetSide ? "DEBET" : "KREDIT"}</div>
        <div className="max-h-[190px] overflow-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0"><tr className="bg-gf-menubar">
              {["DB/CR", "Kode", "Perkiraan", "MU", "Debet", "Kredit", "Kurs", "Note", "Date", ""].map((h) => (
                <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {list.map(({ l, i }) => (
                <tr key={i} className="hover:bg-[#e8eef7]">
                  <td className={td}>{debetSide ? "DB" : "CR"}</td>
                  <td className={`${td} w-[60px]`}>{l.perkirId ?? ""}</td>
                  <td className={td}>
                    <select className="w-full bg-transparent" value={l.perkirId ?? ""} onChange={(e) => { const p = perks.find((x) => x.id === Number(e.target.value)); setLine(i, { perkirId: e.target.value ? Number(e.target.value) : null, perkirNama: p?.nama ?? "" }); }}>
                      <option value="">--pilih perkiraan--</option>{perks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </td>
                  <td className={td}>IDR</td>
                  <td className={td}>{debetSide ? <input className={`${tin} w-[110px] font-mono`} value={jev(l.nilai)} onChange={(e) => setLine(i, { nilai: e.target.value })} /> : <span className="block text-right font-mono">0.00</span>}</td>
                  <td className={td}>{!debetSide ? <input className={`${tin} w-[110px] font-mono`} value={jev(l.nilai)} onChange={(e) => setLine(i, { nilai: e.target.value })} /> : <span className="block text-right font-mono">0.00</span>}</td>
                  <td className={td}>1.0000</td>
                  <td className={td}><input className={`${tin} w-[120px] text-left`} value={jev(l.note)} onChange={(e) => setLine(i, { note: e.target.value })} /></td>
                  <td className={td}><input type="date" className="w-[125px] bg-transparent" value={jev(l.date)} onChange={(e) => setLine(i, { date: e.target.value })} /></td>
                  <td className={td}><button className="text-red-700" onClick={() => set({ lines: (form?.lines ?? []).filter((_, x) => x !== i) })}>✕</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={10} className="px-2 py-2 text-center text-gf-muted">(kosong)</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-gf-border px-2 py-[1px] text-[11px]">
          <button onClick={() => set({ lines: [...(form?.lines ?? []), emptyLine(debetSide)] })} className="gf-3d bg-gf-menubar px-2 py-[1px] text-[10px]">+ Tambah baris</button>
          <span>Total {debetSide ? "Debet" : "Kredit"}: <b className="font-mono">{rp(debetSide ? totalDebet : totalKredit)}</b></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1280px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Jurnal</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">J U R N A L</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak-setup.png`} alt="Cetak Setup" width={52} height={44} /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari no / catatan..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="mb-1 flex items-center gap-2 text-[11px]">
            <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Semua Data</label>
            <span className="ml-auto"><button className="gf-3d bg-gf-menubar px-3 py-[1px] text-[10px] text-green-700">Ctrl+F7</button> <button className="gf-3d bg-gf-menubar px-3 py-[1px] text-[10px] text-gf-muted">Ctrl+F6</button></span>
          </div>
          <div className="max-h-[300px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "No", "Tanggal", "Catatan", "Vendor/Pelanggan", "Divisi", "Jenis", "Debet", "Kredit"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.vendorNama ?? r.pelangNama ?? ""}</td>
                    <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? ""}</td>
                    <td className={td}>{r.jenis != null ? (JENIS[r.jenis] ?? r.jenis) : ""}</td>
                    <td className={`${td} text-right font-mono`}>{r.totalDebet}</td>
                    <td className={`${td} text-right font-mono`}>{r.totalKredit}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1180px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Jurnal {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 flex gap-1">
                <button onClick={() => navStep(-2)} className="gf-3d w-[180px] bg-gf-menubar py-[2px] text-[12px]">{"<<"}</button>
                <button onClick={() => navStep(-1)} className="gf-3d w-[180px] bg-gf-menubar py-[2px] text-[12px]">{"<"}</button>
                <button onClick={() => navStep(1)} className="gf-3d w-[180px] bg-gf-menubar py-[2px] text-[12px]">{">"}</button>
                <button onClick={() => navStep(2)} className="gf-3d w-[180px] bg-gf-menubar py-[2px] text-[12px]">{">>"}</button>
                <button onClick={() => setMsg("Masuk List — pilih dari daftar transaksi (menyusul)")} className="gf-3d ml-auto w-[420px] bg-gf-menubar py-[4px] text-[12px]">Masuk List</button>
              </div>
              <div className="grid grid-cols-[80px_1fr_100px_1fr_90px_150px] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>No :</span>
                <input className="gf-3d w-[120px] bg-white px-2 py-[2px]" value={jev(form.no)} onChange={(e) => set({ no: e.target.value })} placeholder="(auto)" />
                <span className="text-right">Tanggal :</span>
                <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                <span className="text-right">ID :</span>
                <input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "(auto)"} />
                <span>Divisi :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span className="text-right">Jenis :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.jenis ?? ""} onChange={(e) => set({ jenis: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{Object.entries(JENIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <span>Vendor/Pelanggan :</span>
                <div className="flex gap-1">
                  <select className="gf-3d flex-1 bg-white px-1 py-[2px] text-[11px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null, pelangId: null })}>
                    <option value="">-- vendor --</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                  </select>
                  <select className="gf-3d flex-1 bg-white px-1 py-[2px] text-[11px]" value={form.pelangId ?? ""} onChange={(e) => set({ pelangId: e.target.value ? Number(e.target.value) : null, vendorId: null })}>
                    <option value="">-- pelanggan --</option>{pelanggans.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <span className="text-right">Catatan :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {renderGrid(true)}
                {renderGrid(false)}
              </div>
              <div className="mt-1 flex items-center gap-3 text-[12px]">
                <span>Nilai : <b className="font-mono">{rp(totalDebet)}</b></span>
                <span className={seimbang ? "text-green-700" : "text-red-700"}>{seimbang ? "SEIMBANG ✔" : `TIDAK SEIMBANG (selisih ${rp(Math.abs(totalDebet - totalKredit))})`}</span>
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={onSimpan} className="gf-3d w-[520px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[520px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
