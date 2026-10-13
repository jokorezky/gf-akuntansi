"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Row = {
  id: number; list?: string | null; type?: number | null; kelompok?: number | null; kelompokNama?: string | null;
  kelompok2?: number | null; hitungan?: number | null; hargaJual?: number | null;
  itemId?: number | null; itemNama?: string | null; itemExtraId?: number | null;
  harga1?: string | null; harga2?: string | null; harga3?: string | null; harga4?: string | null; harga5?: string | null;
  pabxExt?: string | null; keyRoom?: string | null; keyLift?: string | null; defOut?: string | null;
  hide?: boolean | null; catatan?: string | null;
};

const HF = `id list type kelompok kelompokNama kelompok2 hitungan hargaJual itemId itemNama itemExtraId harga1 harga2 harga3 harga4 harga5 pabxExt keyRoom keyLift defOut hide catatan`;
const LIST = `query($q:String){ eceranListList(q:$q){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ eceranListById(id:$id){ ${HF} } }`;
const CREATE = `mutation($input:EceranListInput!){ createEceranList(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:EceranListInput!){ updateEceranList(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteEceranList(id:$id) }`;
const REFS = `{ itemList(limit:500){ rows { id nama } } }`;
const ICON = "/gf-icons/screens/pembelian";

const jev = (v: string | null | undefined) => v ?? "";

export default function EceranListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [items, setItems] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ eceranListList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.eceranListList.rows); setTotal(d.eceranListList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ itemList: { rows: Ref[] } }>(REFS).then((d) => setItems(d.itemList.rows)).catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambah() {
    setErr(""); setMsg(""); setMode("create");
    setForm({ id: 0, list: "", type: null, hitungan: 1, hargaJual: 1, harga1: "0", harga2: "0", harga3: "0", harga4: "0", harga5: "0", pabxExt: "", keyRoom: "", keyLift: "", defOut: "", hide: false, catatan: "" });
  }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ eceranListById: Row }>(BYID, { id: sel });
    setMode("edit"); setForm(d.eceranListById);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus eceran list id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.list) return setErr("Eceran List (nama) wajib diisi.");
    setErr("");
    try {
      const input = {
        list: form.list, type: form.type ?? null, kelompok: form.kelompok ?? null, kelompok2: form.kelompok2 ?? null,
        hitungan: form.hitungan ?? null, hargaJual: form.hargaJual ?? null,
        itemId: form.itemId ?? null, itemExtraId: form.itemExtraId ?? null,
        harga1: form.harga1 || "0", harga2: form.harga2 || "0", harga3: form.harga3 || "0", harga4: form.harga4 || "0", harga5: form.harga5 || "0",
        pabxExt: form.pabxExt || null, keyRoom: form.keyRoom || null, keyLift: form.keyLift || null, defOut: form.defOut || null,
        hide: form.hide ?? false, catatan: form.catatan || null,
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const itemOptions = items.map((i) => <option key={i.id} value={i.id}>{i.nama}</option>);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1150px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Eceran List</div>
        <div className="p-2">
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Menu</button>
            <button onClick={() => setMsg("Kelompok — gunakan kolom Kelompok di form")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[10px]">Kelompok</button>
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
                {["Type", "Kelompok", "List", "Hitungan", "ID", "Item", "Harga *1-*5", "Non Aktif"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.type ?? ""}</td>
                    <td className={td}>{r.kelompokNama ?? r.kelompok ?? ""}</td>
                    <td className={td}>{r.list}</td>
                    <td className={td}>{r.hitungan ?? ""}</td>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.itemNama ?? ""}</td>
                    <td className={td}>{[r.harga1, r.harga2, r.harga3, r.harga4, r.harga5].map((h) => Number(h ?? 0).toLocaleString("id-ID")).join(" / ")}</td>
                    <td className={td}>{r.hide ? "✔" : ""}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-center text-gf-muted">Belum ada data (s_ecrlst preset).</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total} — sumber: gf.s_ecrlst baris preset (sts_ecr NULL)</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-3">
          <div className="w-[1000px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Eceran List {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[100px_1fr_70px_110px] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Eceran List :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.list)} onChange={(e) => set({ list: e.target.value })} />
                <span className="text-right">ID :</span>
                <input className="gf-3d bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "(auto)"} />
                <span>Kelompok :</span>
                <input className="gf-3d w-[90px] bg-white px-2 py-[2px]" value={form.kelompok ?? ""} onChange={(e) => set({ kelompok: e.target.value ? Number(e.target.value) : null })} placeholder="ID" />
                <span className="text-[11px]">Type :</span>
                <input className="gf-3d w-[90px] bg-white px-2 py-[2px]" value={form.type ?? ""} onChange={(e) => set({ type: e.target.value ? Number(e.target.value) : null })} />
                <span className="text-right">Hitungan :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.hitungan ?? ""} onChange={(e) => set({ hitungan: e.target.value ? Number(e.target.value) : null })} />
                <span>H. Jual :</span>
                <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right" value={form.hargaJual ?? ""} onChange={(e) => set({ hargaJual: e.target.value ? Number(e.target.value) : null })} />
                <span className="text-[11px]">Kelompok 2 :</span>
                <input className="gf-3d w-[90px] bg-white px-2 py-[2px]" value={form.kelompok2 ?? ""} onChange={(e) => set({ kelompok2: e.target.value ? Number(e.target.value) : null })} />
                <span className="text-right">#Item :</span>
                <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={form.itemId ?? ""} onChange={(e) => set({ itemId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{itemOptions}
                </select>
                <span>#Item (Extra) :</span>
                <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={form.itemExtraId ?? ""} onChange={(e) => set({ itemExtraId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{itemOptions}
                </select>
                <span className="text-right">PABX Ext :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.pabxExt)} onChange={(e) => set({ pabxExt: e.target.value })} />
                <span>#Key Room :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.keyRoom)} onChange={(e) => set({ keyRoom: e.target.value })} />
                <span className="text-right">#Key Lift :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.keyLift)} onChange={(e) => set({ keyLift: e.target.value })} />
                <span>Def. ChkOut :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.defOut)} onChange={(e) => set({ defOut: e.target.value })} />
                <span className="text-right">Catatan :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.catatan)} onChange={(e) => set({ catatan: e.target.value })} />
              </div>

              <div className="mt-2 border border-gf-border bg-[#f4f4f4] p-2">
                <div className="mb-1 text-[11px] font-bold">Harga :</div>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  {([["harga1", "*1"], ["harga2", "*2"], ["harga3", "*3"], ["harga4", "*4"], ["harga5", "*5"]] as const).map(([k, label]) => (
                    <div key={k} className="flex items-center gap-1">
                      <span className="text-[11px]">{label}</span>
                      <input className="gf-3d w-[110px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form[k] as string | null)} onChange={(e) => set({ [k]: e.target.value } as Partial<Row>)} />
                    </div>
                  ))}
                </div>
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
                <button onClick={() => set({ hide: !form.hide })} className={`gf-3d px-4 py-[4px] text-[12px] ${form.hide ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Non Aktif</button>
                <button onClick={() => setMsg("Lookup item — gunakan combo #Item / #Item (Extra)")} className="gf-3d bg-gf-menubar px-2 py-[4px] text-[12px]">{"<>"}</button>
                <button onClick={onSimpan} className="gf-3d w-[400px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[400px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
