"use client";





import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Pager } from "@/components/gf/Pager";
import { confirmDialog } from "@/components/gf/ConfirmHost";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Perk = { id: number; kode?: string | null; nama?: string | null };
type Row = {
  id: number; tipe?: string | null; hide?: boolean | null; gfpayment?: boolean | null; showQris?: boolean | null;
  perkirId?: number | null; perkirNama?: string | null; chargestxt?: string | null;
  charges?: string | null; chargesnil?: string | null; chargescd1?: string | null; chargescd2?: string | null;
  chargesitm?: boolean | null; noRound?: boolean | null; adjust?: string | null;
  glbDiscs?: boolean | null; glbDisc?: string | null; glbDiscnl?: string | null; glbDisccd?: string | null;
  cost?: string | null; perkirId2?: number | null;
};

const HF = `id tipe hide gfpayment showQris perkirId perkirNama chargestxt charges chargesnil chargescd1 chargescd2 chargesitm noRound adjust glbDiscs glbDisc glbDiscnl glbDisccd cost perkirId2`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ tipePembayaranList(q:$q, limit:$limit, offset:$offset){ total rows { ${HF} } } }`;
const BYID = `query($id:Int!){ tipePembayaranById(id:$id){ ${HF} } }`;
const CREATE = `mutation($input:TipePembayaranInput!){ createTipePembayaran(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:TipePembayaranInput!){ updateTipePembayaran(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteTipePembayaran(id:$id) }`;
const PERKS = `{ perkiraanList(limit:500){ rows { id kode nama } } }`;
const jev = (v: string | null | undefined) => v ?? "";

export default function TipePembayaranPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { setPage(1); }, [q]);
  const load = useCallback(async () => {
    const d = await gql<{ tipePembayaranList: { total: number; rows: Row[] } }>(LIST, { q, limit: 10, offset: (page - 1) * 10 });
    setRows(d.tipePembayaranList.rows); setTotal(d.tipePembayaranList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ perkiraanList: { rows: Perk[] } }>(PERKS).then((d) => setPerks(d.perkiraanList.rows)).catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambah() {
    setErr(""); setMsg(""); setMode("create");
    setForm({ id: 0, tipe: "", hide: false, gfpayment: false, showQris: false, chargestxt: "", charges: "0", chargesnil: "0", chargescd1: "0", chargescd2: "0", chargesitm: false, noRound: false, adjust: "0", glbDiscs: false, glbDisc: "0", glbDiscnl: "0", glbDisccd: "0", cost: "0" });
  }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ tipePembayaranById: Row }>(BYID, { id: sel });
    setMode("edit"); setForm(d.tipePembayaranById);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!(await confirmDialog(`Hapus tipe pembayaran id ${sel}? (soft delete)`))) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.tipe) return setErr("Tipe wajib diisi.");
    setErr("");
    try {
      const input = {
        tipe: form.tipe, hide: form.hide ?? false, gfpayment: form.gfpayment ?? false, showQris: form.showQris ?? false,
        perkirId: form.perkirId ?? null, chargestxt: form.chargestxt || null,
        charges: form.charges || "0", chargesnil: form.chargesnil || "0", chargescd1: form.chargescd1 || "0", chargescd2: form.chargescd2 || "0",
        chargesitm: form.chargesitm ?? false, noRound: form.noRound ?? false, adjust: form.adjust || "0",
        glbDiscs: form.glbDiscs ?? false, glbDisc: form.glbDisc || "0", glbDiscnl: form.glbDiscnl || "0", glbDisccd: form.glbDisccd || "0",
        cost: form.cost || "0", perkirId2: form.perkirId2 ?? null,
      };
      if (mode === "create") await gql(CREATE, { input }); else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const perkOptions = perks.map((p) => <option key={p.id} value={p.id}>{p.kode} {p.nama}</option>);

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">Tipe Pembayaran</div>
        <div className="p-2">
          <div className="mb-2 flex items-center gap-1">
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
                {["Tipe Pembayaran", "%Charges", "Charges", "Charges-Cond", "To-Adjustment", "%Disc", "Disc", "Hide", "GF-Pay", "QRIS", "ID"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-accent/[0.07]" : "hover:bg-slate-50"}`}>
                    <td className={td}>{r.tipe}</td>
                    <td className={`${td} text-right`}>{r.charges}</td>
                    <td className={`${td} text-right`}>{r.chargesnil}</td>
                    <td className={td}>{r.chargescd1}-{r.chargescd2}</td>
                    <td className={`${td} text-right`}>{r.adjust}</td>
                    <td className={td}>{r.glbDiscs ? "✔" : ""}</td>
                    <td className={`${td} text-right`}>{r.glbDisc}</td>
                    <td className={td}>{r.hide ? "✔" : ""}</td>
                    <td className={td}>{r.gfpayment ? "✔" : ""}</td>
                    <td className={td}>{r.showQris ? "✔" : ""}</td>
                    <td className={td}>{r.id}</td>
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
          <div className="w-[900px] overflow-hidden rounded-xl border border-gf-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Tipe Pembayaran {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[80px_1fr_80px_1fr] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>Tipe :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.tipe)} onChange={(e) => set({ tipe: e.target.value })} />
                <span className="text-right">ID :</span>
                <input className="gf-3d w-[100px] bg-[#c8f0c8] px-2 py-[2px]" readOnly value={mode === "edit" ? form.id : "(auto)"} />
                <span>Cost :</span>
                <input className="gf-3d w-[120px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form.cost)} onChange={(e) => set({ cost: e.target.value })} />
                <span className="text-right">#Link :</span>
                <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={form.perkirId2 ?? ""} onChange={(e) => set({ perkirId2: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{perkOptions}
                </select>
                <span>Charges :</span>
                <div className="flex items-center gap-1">
                  <input className="gf-3d w-[110px] bg-white px-2 py-[2px]" value={jev(form.chargestxt)} onChange={(e) => set({ chargestxt: e.target.value })} placeholder="label charges" />
                  <span className="text-[11px]">IDR</span>
                  <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form.charges)} onChange={(e) => set({ charges: e.target.value })} />
                  <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form.chargesnil)} onChange={(e) => set({ chargesnil: e.target.value })} />
                </div>
                <span className="text-right">* Kond :</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px]">Jika Total &gt;=</span>
                  <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form.chargescd1)} onChange={(e) => set({ chargescd1: e.target.value })} />
                  <span>-</span>
                  <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form.chargescd2)} onChange={(e) => set({ chargescd2: e.target.value })} />
                </div>
                <span>Adjust :</span>
                <input className="gf-3d w-[120px] bg-white px-2 py-[2px] text-right font-mono" value={jev(form.adjust)} onChange={(e) => set({ adjust: e.target.value })} />
                <span className="text-right">Kas Perkiraan :</span>
                <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" value={form.perkirId ?? ""} onChange={(e) => set({ perkirId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--</option>{perkOptions}
                </select>
              </div>

              <div className="mt-2 border border-gf-border bg-[#f4f4f4] p-2 text-[12px]">
                <div className="mb-1 grid grid-cols-[80px_1fr_80px_1fr] items-center gap-x-2 gap-y-1">
                  <span>Disc :</span>
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={form.glbDiscs ?? false} onChange={(e) => set({ glbDiscs: e.target.checked })} /> %Disc</label>
                    <input className="gf-3d w-[80px] bg-white px-2 py-[1px] text-right" value={jev(form.glbDisc)} onChange={(e) => set({ glbDisc: e.target.value })} title="Disc" />
                    <input className="gf-3d w-[80px] bg-white px-2 py-[1px] text-right" value={jev(form.glbDiscnl)} onChange={(e) => set({ glbDiscnl: e.target.value })} title="Disc nilai" />
                    <input className="gf-3d w-[80px] bg-white px-2 py-[1px] text-right" value={jev(form.glbDisccd)} onChange={(e) => set({ glbDisccd: e.target.value })} title="Disc kondisi" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => set({ hide: !form.hide })} className={`gf-3d px-3 py-[3px] text-[11px] ${form.hide ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Non Aktif</button>
                  <button onClick={() => set({ gfpayment: !form.gfpayment })} className={`gf-3d px-3 py-[3px] text-[11px] ${form.gfpayment ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>GF-Payment</button>
                  <button onClick={() => set({ showQris: !form.showQris })} className={`gf-3d px-3 py-[3px] text-[11px] ${form.showQris ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Tampil QRIS</button>
                  <button onClick={() => set({ chargesitm: !form.chargesitm })} className={`gf-3d px-3 py-[3px] text-[11px] ${form.chargesitm ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Charges Hitung Per Item</button>
                  <button onClick={() => set({ noRound: !form.noRound })} className={`gf-3d px-3 py-[3px] text-[11px] ${form.noRound ? "bg-[#ffe9a8]" : "bg-gf-menubar"}`}>Charges Tanpa Pembulatan</button>
                </div>
              </div>

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
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
