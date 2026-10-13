"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Prditm = { id: number; nama?: string | null; stockId?: number | null; jumlah?: string | null };
type Hdr = {
  id: number; tanggal?: string | null; divisiId?: number | null; prditmId?: number | null; prditmNama?: string | null;
  jumlah?: string | null; perkir1?: number | null; perkir2?: number | null; perkir3?: number | null;
  nilai1?: string | null; nilai2?: string | null; nilai3?: string | null;
  catatan?: string | null; catatan2?: string | null; catatan3?: string | null;
};

const HF = `id tanggal divisiId prditmId prditmNama jumlah perkir1 perkir2 perkir3 nilai1 nilai2 nilai3 catatan catatan2 catatan3`;
const LIST = `query($q:String){ produksiList(q:$q){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ produksiById(id:$id){ ${HF} } }`;
const CREATE = `mutation($input:ProduksiInput!){ createProduksi(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:ProduksiInput!){ updateProduksi(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteProduksi(id:$id) }`;
const REFS = `{ perkiraanRefList { id nama } divisiRefList { id nama } prditmRefList { id nama stockId jumlah } }`;
const ICON = "/gf-icons/screens/pembelian";

const jev = (v: string | null | undefined) => v ?? "";
const empty = (): Hdr => ({ id: 0, tanggal: new Date().toISOString().slice(0, 10), divisiId: null, prditmId: null, jumlah: "0", nilai1: "0", nilai2: "0", nilai3: "0", catatan: "", catatan2: "", catatan3: "" });

export default function BarangProduksiPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [perks, setPerks] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [prditm, setPrditm] = useState<Prditm[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ produksiList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.produksiList.rows); setTotal(d.produksiList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ perkiraanRefList: Ref[]; divisiRefList: Ref[]; prditmRefList: Prditm[] }>(REFS)
      .then((d) => { setPerks(d.perkiraanRefList); setDivisi(d.divisiRefList); setPrditm(d.prditmRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ produksiById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm({ ...empty(), ...d.produksiById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus produksi id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const input = {
        tanggal: form.tanggal || null, divisiId: form.divisiId ?? null, prditmId: form.prditmId ?? null,
        jumlah: form.jumlah || "0",
        perkir1: form.perkir1 ?? null, perkir2: form.perkir2 ?? null, perkir3: form.perkir3 ?? null,
        nilai1: form.nilai1 || "0", nilai2: form.nilai2 || "0", nilai3: form.nilai3 || "0",
        catatan: form.catatan || null, catatan2: form.catatan2 || null, catatan3: form.catatan3 || null,
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
    const d = await gql<{ produksiById: Hdr }>(BYID, { id: asc[t].id });
    setForm({ ...empty(), ...d.produksiById });
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const jev2 = jev;

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1180px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Barang Produksi</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu Utama</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Z..A</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">CheckBox</button>
            <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">B A R A N G&nbsp;&nbsp;P R O D U K S I</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => setMsg("Kelompok — gunakan daftar item produksi di form")} className="gf-3d bg-gf-menubar px-3 py-[10px] text-[11px]">Kelompok</button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak-setup.png`} alt="Cetak Setup" width={52} height={44} /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[320px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Tanggal", "Produksi", "ProdID", "Jumlah", "Divisi", "Catatan", "Catatan *2", "Catatan *3"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.prditmNama}</td>
                    <td className={td}>{r.prditmId}</td>
                    <td className={`${td} text-right font-mono`}>{r.jumlah}</td>
                    <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? ""}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.catatan2}</td>
                    <td className={td}>{r.catatan3}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total} · relasi: s_prodsi.prditm_id → s_prditm (Daftar Item Produksi)</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1050px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Barang Produksi {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 flex gap-1">
                {(["<<", "<", ">", ">>"] as const).map((t, i) => (
                  <button key={t} onClick={() => navStep([-2, -1, 1, 2][i])} className="gf-3d w-[220px] bg-gf-menubar py-[3px] text-[12px]">{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-[80px_1fr_70px_110px_90px_160px] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Item :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.prditmId ?? ""} onChange={(e) => set({ prditmId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">-- daftar item produksi (s_prditm) --</option>
                  {prditm.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
                <span className="text-right">Jumlah :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right font-mono" value={jev(form.jumlah)} onChange={(e) => set({ jumlah: e.target.value })} />
                <span className="text-right">Divisi :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span>Tanggal :</span>
                <input type="date" className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={jev(form.tanggal)} onChange={(e) => set({ tanggal: e.target.value })} />
                <span className="text-right">ID :</span>
                <input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "(auto)"} />
              </div>

              <div className="mt-2 border border-gf-border bg-[#f4f4f4] p-2">
                <div className="mb-1 text-[11px] font-bold">Tambahan Cost/Biaya Produksi dari :</div>
                {([["nilai1", "perkir1"], ["nilai2", "perkir2"], ["nilai3", "perkir3"]] as const).map(([nk, pk], i) => (
                  <div key={nk} className="mb-1 grid grid-cols-[70px_250px_130px] items-center gap-1 text-[12px]">
                    <span>#Acc *{i + 1} :</span>
                    <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={(form[pk as keyof Hdr] as number | null) ?? ""} onChange={(e) => set({ [pk]: e.target.value ? Number(e.target.value) : null } as Partial<Hdr>)}>
                      <option value="">--</option>{perks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px]">Nilai *{i + 1} :</span>
                      <input className="gf-3d w-[110px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form[nk as keyof Hdr] as string | null)} onChange={(e) => set({ [nk]: e.target.value } as Partial<Hdr>)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-[70px_1fr] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Catatan :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev2(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
                <span />
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev2(form.catatan2)} onChange={(e) => set({ catatan2: e.target.value })} />
                <span />
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev2(form.catatan3)} onChange={(e) => set({ catatan3: e.target.value })} />
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={onSimpan} className="gf-3d w-[450px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[450px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
