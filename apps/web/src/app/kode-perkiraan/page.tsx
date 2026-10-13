"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; kode?: string | null; mataUang?: string | null };
type Row = {
  id: number; kode?: string | null; nama?: string | null; header?: boolean | null; golongan?: number | null;
  golonganNama?: string | null; debet?: boolean | null; multiCur?: boolean | null; tarikKurs?: boolean | null;
  nonRev?: boolean | null; salAwal?: string | null; mauang?: number | null; mauangKode?: string | null;
  cairchbg?: number | null; catatan?: string | null; securityInfo?: string | null;
};

const HF = `id kode nama header golongan golonganNama debet multiCur tarikKurs nonRev salAwal mauang mauangKode cairchbg catatan securityInfo`;
const LIST = `query($q:String,$golongan:Int){ perkiraanList(q:$q, golongan:$golongan){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ perkiraanById(id:$id){ ${HF} } }`;
const CREATE = `mutation($input:PerkiraanInput!){ createPerkiraan(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PerkiraanInput!){ updatePerkiraan(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePerkiraan(id:$id) }`;
const MU = `{ mauangList { id kode mataUang } }`;
const ICON = "/gf-icons/screens/pembelian";
const GOL = ["---", "AKTIVA", "KEWAJIBAN", "MODAL", "PENDAPATAN", "BIAYA"];

const jev = (v: string | null | undefined) => v ?? "";

export default function KodePerkiraanPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [golF, setGolF] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [muList, setMuList] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [tab, setTab] = useState<0 | 1>(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ perkiraanList: { total: number; rows: Row[] } }>(LIST, { q, golongan: golF || null });
    setRows(d.perkiraanList.rows); setTotal(d.perkiraanList.total);
  }, [q, golF]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ mauangList: Ref[] }>(MU).then((d) => setMuList(d.mauangList)).catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setTab(0); setForm({ id: 0, kode: "", nama: "", header: false, golongan: 1, debet: true, multiCur: false, tarikKurs: false, nonRev: false, salAwal: "0", mauang: 1, cairchbg: null, catatan: "" }); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ perkiraanById: Row }>(BYID, { id: sel });
    setMode("edit"); setTab(0); setForm(d.perkiraanById);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus kode perkiraan id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.kode || !form.nama) return setErr("Kode dan Nama wajib diisi.");
    setErr("");
    try {
      const input = {
        kode: form.kode, nama: form.nama, header: form.header ?? false, golongan: form.golongan ?? 0,
        debet: form.debet ?? true, multiCur: form.multiCur ?? false, tarikKurs: form.tarikKurs ?? false,
        nonRev: form.nonRev ?? false, salAwal: form.salAwal || "0", mauang: form.mauang ?? 1,
        cairchbg: form.cairchbg ?? null, catatan: form.catatan || null,
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-1 py-[1px]";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Kode Perkiraan</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <button onClick={() => setMsg("Template — menyusul")} className="gf-3d bg-gf-menubar px-3 py-[10px] text-[11px]">Template</button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">K O D E&nbsp;&nbsp;P E R K I R A A N</span>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="gf-3d bg-white px-1 py-[3px] text-[12px]" value={golF} onChange={(e) => setGolF(Number(e.target.value))}>
              {GOL.map((g, i) => <option key={i} value={i}>{i === 0 ? "(-Semua Golongan-)" : g}</option>)}
            </select>
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><img src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><img src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[430px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Kode", "Nama", "Gol", "Hdr", "Debet", "Multi Curr", "Tarik Kurs", "Non-Reverse", "Saldo Awal", "M.U.", "CH/BG", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : r.header ? "bg-[#f0f0f0]" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.kode}</td>
                    <td className={td}>{r.nama}</td>
                    <td className={td}>{r.golonganNama}</td>
                    <td className={td}>{r.header ? "✔" : ""}</td>
                    <td className={td}>{r.debet ? "D" : "K"}</td>
                    <td className={td}>{r.multiCur ? "✔" : ""}</td>
                    <td className={td}>{r.tarikKurs ? "✔" : ""}</td>
                    <td className={td}>{r.nonRev ? "✔" : ""}</td>
                    <td className={`${td} text-right font-mono`}>{Number(r.salAwal ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2 })}</td>
                    <td className={td}>{r.mauangKode}</td>
                    <td className={td}>{r.cairchbg ?? ""}</td>
                    <td className={td}>{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={13} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total} akun</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[960px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Kode Perkiraan {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-2 flex items-center gap-2">
                <button onClick={() => { setTab(0); set({ header: true }); }} className={`gf-3d px-6 py-[3px] text-[12px] ${tab === 0 || form.header ? "bg-white font-bold" : "bg-gf-menubar"}`}>Header</button>
                <button onClick={() => { setTab(1); set({ header: false }); }} className={`gf-3d px-6 py-[3px] text-[12px] ${tab === 1 && !form.header ? "bg-white font-bold" : "bg-gf-menubar"}`}>Detail</button>
                <span className="ml-auto text-[11px] text-gf-muted">{form.header ? "Header (parent/non-posting)" : "Detail (posting)"}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr_70px_1fr_70px_170px] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>ID :</span>
                <input className="gf-3d w-[90px] bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "(auto)"} />
                <span>Kode :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.kode)} onChange={(e) => set({ kode: e.target.value })} />
                <span className="text-right">Gol :</span>
                <div className="flex items-center gap-1">
                  <select className="gf-3d w-[130px] bg-white px-1 py-[2px]" value={form.golongan ?? 0} onChange={(e) => set({ golongan: Number(e.target.value) })}>
                    {GOL.map((g, i) => <option key={i} value={i}>{g}</option>)}
                  </select>
                  <span className="text-[11px]">1.0000 {GOL[form.golongan ?? 0]}</span>
                </div>
                <span>Nama :</span>
                <input className="gf-3d col-span-3 bg-white px-2 py-[2px]" value={jev(form.nama)} onChange={(e) => set({ nama: e.target.value })} />
                <span>M.U. :</span>
                <div className="flex items-center gap-1">
                  <select className="gf-3d w-[80px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}>
                    {muList.map((m) => <option key={m.id} value={m.id}>{m.kode}</option>)}
                  </select>
                  <span className="text-[11px]">Kurs : 1.0000</span>
                  <span className="text-[11px]">IDR</span>
                </div>
                <span>Limit :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right font-mono" value={""} readOnly placeholder="(tidak dipakai GF IDR)" />
                <span className="text-right">Saldo Awal :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right font-mono" value={jev(form.salAwal)} onChange={(e) => set({ salAwal: e.target.value })} />
                <span>Note :</span>
                <input className="gf-3d col-span-3 bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 border border-gf-border bg-[#f4f4f4] p-2 text-[12px]">
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.debet ?? true} onChange={(e) => set({ debet: e.target.checked })} /> Kode Perkiraan Nilai Debet</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.multiCur ?? false} onChange={(e) => set({ multiCur: e.target.checked })} /> Multi Currency</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.tarikKurs ?? false} onChange={(e) => set({ tarikKurs: e.target.checked })} /> Tarik Selisih Kurs</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.nonRev ?? false} onChange={(e) => set({ nonRev: e.target.checked })} /> Non-Reverse</label>
                <button onClick={() => setMsg("DB (d/h CR) — penanda saldo normal; di GF memakai checkbox Debet.")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">DB</button>
                <span className="text-[11px]">CH/BG :</span>
                <input className="gf-3d w-[60px] bg-white px-2 py-[1px] text-right" value={form.cairchbg ?? ""} onChange={(e) => set({ cairchbg: e.target.value ? Number(e.target.value) : null })} />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="border border-gf-border bg-white">
                  <div className="border-b border-gf-border bg-gf-menubar px-1 font-bold">User (info GF : bitmap biner)</div>
                  <div className="p-2 text-gf-muted">{form.securityInfo ? `Security tersimpan: ${form.securityInfo} — data biner internal GF, tidak dibongkar 1:1 (dicatat).` : "Tidak ada security tersimpan."}</div>
                </div>
                <div className="border border-gf-border bg-white">
                  <div className="border-b border-gf-border bg-gf-menubar px-1 font-bold">User / Limit</div>
                  <div className="p-2 text-gf-muted">Limit per user di GF tersimpan di bitmap security (kolom biner). Pembacaan 1:1 menunggu dekode format (dicatat sebagai keterbatasan).</div>
                </div>
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Pilih User (referensi) — mengikuti security GF")} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[12px]">{"<>"}</button>
                <button onClick={onSimpan} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[300px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
