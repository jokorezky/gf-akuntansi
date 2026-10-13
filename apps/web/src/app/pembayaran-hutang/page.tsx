"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  pembelId?: number | null; retpemId?: number | null; dcnhutId?: number | null; deppemId?: number | null;
  lunas?: string | null; discount?: string | null; denda?: string | null; catatan?: string | null;
  no?: string | null; tanggal?: string | null; invTotal?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; vendorId?: number | null; vendorNama?: string | null;
  divisiId?: number | null; catatan?: string | null; total?: string | null; discTotal?: string | null;
  alsBatal?: string | null; konfOleh?: number | null; konfTgl?: string | null; konfJam?: string | null;
  entryBy?: number | null; entryDate?: string | null; lines?: Line[];
};
type DH = { id: number; no?: string | null; tanggal?: string | null; vendorNama?: string | null; total?: string | null; sisa?: string | null };

const LF = `pembelId retpemId dcnhutId deppemId lunas discount denda catatan no tanggal invTotal`;
const HF = `id no tanggal vendorId vendorNama divisiId catatan total discTotal alsBatal konfOleh konfTgl konfJam entryBy entryDate`;
const LIST = `query($q:String){ paymentList(q:$q){ total rows { ${HF} } } }`;
const REFS = `{ vendorRefList { id nama } divisiRefList { id nama } }`;
const DH = `{ daftarHutangList { total rows { id no tanggal vendorNama total sisa } } }`;
const BYID = `query($id:Int!){ paymentById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:PaymentInput!){ createPayment(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PaymentInput!){ updatePayment(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePayment(id:$id) }`;
const ICON = "/gf-icons/screens/pembelian";

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
const emptyLine = (): Line => ({ pembelId: null, lunas: "0", discount: "0", denda: "0", catatan: "" });
const empty = (): Hdr => ({ id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), vendorId: null, divisiId: null, catatan: "", lines: [emptyLine()] });

export default function PembayaranHutangPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [pickList, setPickList] = useState(false);
  const [dh, setDh] = useState<DH[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ paymentList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.paymentList.rows);
    setTotal(d.paymentList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setVendors(d.vendorRefList); setDivisi(d.divisiRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    const bayar = lines.reduce((s, l) => s + num(l.lunas), 0);
    const disc = lines.reduce((s, l) => s + num(l.discount), 0);
    const denda = lines.reduce((s, l) => s + num(l.denda), 0);
    return { bayar: r2(bayar), disc: r2(disc), denda: r2(denda) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ paymentById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm(d.paymentById); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus pembayaran id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, vendorNama: _vn, total: _t, discTotal: _dt, alsBatal: _ab, konfOleh: _ko, konfTgl: _kt, konfJam: _kj, entryBy: _eb, entryDate: _ed, ...rest } = form;
      const input = { ...rest, lines: (form.lines ?? []).map((l) => ({ pembelId: l.pembelId, retpemId: l.retpemId, dcnhutId: l.dcnhutId, deppemId: l.deppemId, lunas: l.lunas, discount: l.discount, denda: l.denda, catatan: l.catatan })) };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }
  async function openPick() {
    const d = await gql<{ daftarHutangList: { rows: DH[] } }>(DH);
    setDh(d.daftarHutangList.rows); setPickList(true);
  }
  function addFromDh(x: DH) {
    const inv = num(x.total);
    set({ lines: [...(form?.lines ?? []).filter((l) => l.pembelId), { pembelId: x.id, no: x.no, tanggal: x.tanggal, invTotal: x.total, lunas: x.sisa, discount: "0", denda: "0", catatan: "" }], id: form?.id ?? 0 });
    setPickList(false); setMsg(`Baris ${x.no} ditambahkan (sisa ${x.sisa}). invTotal=${inv}`);
  }

  const td = "border border-gf-border px-1 py-[1px]";
  const tin = "w-full bg-transparent text-right";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Pembayaran Hutang</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="Z..A" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E M B A Y A R A N&nbsp;&nbsp;H U T A N G</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>(-Semua Divisi-)</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/laporan.png`} alt="Laporan" width={58} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Rincian Per Item — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/rincian.png`} alt="Rincian" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak-setup.png`} alt="Cetak Setup" width={52} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak.png`} alt="Cetak" width={52} height={44} unoptimized /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tambah.png`} alt="Tambah" width={56} height={44} unoptimized /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={56} height={44} unoptimized /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/hapus.png`} alt="Hapus" width={56} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} unoptimized /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[340px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "No", "Tanggal", "Vendor", "IDR", "Disc: IDR", "Divisi", "Catatan", "Alasan Batal", "Confirm By", "Confirm D", "Confirm J", "Entry By", "Entry Date"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.vendorNama}</td>
                    <td className={`${td} text-right font-mono`}>{r.total}</td>
                    <td className={`${td} text-right font-mono`}>{r.discTotal}</td>
                    <td className={td}>{divisi.find((d) => d.id === r.divisiId)?.nama ?? ""}</td>
                    <td className={td}>{r.catatan}</td>
                    <td className={td}>{r.alsBatal}</td>
                    <td className={td}>{r.konfOleh}</td>
                    <td className={td}>{r.konfTgl}</td>
                    <td className={td}>{r.konfJam}</td>
                    <td className={td}>{r.entryBy}</td>
                    <td className={td}>{r.entryDate}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={14} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_320px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={sel ?? ""} />
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Semua Data</label>
              <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>No :</span><input className="gf-3d bg-white px-2 py-[1px]" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>Vendor :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.vendorNama ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.catatan ?? ""} />
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <div className="flex gap-1">
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-green-700">Ctrl+F7</button>
                <button className="gf-3d flex-1 bg-gf-menubar px-1 py-[2px] text-[10px] text-gf-muted">Ctrl+F6</button>
              </div>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[1160px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Pembayaran Hutang {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-[70px_1fr_70px_150px_70px_1fr] items-center gap-x-2 gap-y-1 text-[12px]">
                <span>ID :</span>
                <span className="gf-3d bg-[#ccff99] px-2 py-[2px] font-mono">{mode === "create" ? "???" : form.id}</span>
                <span>Tanggal :</span>
                <input type="date" className="gf-3d bg-white px-2 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} />
                <span>Vendor :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">*** BELUM DIPILIH ***</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
                <span>No :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value })} />
                <span>Divisi :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">--Semua Divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
                <span>Catatan :</span>
                <input className="gf-3d col-span-5 bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
              </div>

              <div className="mt-2 flex items-center gap-1">
                <button onClick={openPick} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[11px]">Tambah dari List</button>
                <button onClick={() => setMsg("Tambah dari Daftar Tagihan (retur/DN/CN) — menyusul")} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[11px]">Tambah dari Daftar Tagihan</button>
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()], id: form.id })} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[11px]">Tambah</button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[11px]">Koreksi</button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel), id: form.id })} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[11px]">Hapus</button>
                <button onClick={() => setMsg("Disc — isi kolom Discount per baris")} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px]">Disc</button>
              </div>

              <div className="mt-1 max-h-[260px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-gf-menubar">
                    {["", "No", "MU", "Discount", "Bayar", "Total", "Sisa Hutang", "Sisa Hutang (Ex)", "Tanggal", "Vendor", "Kurs", "Catatan", "Total-3"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => {
                      const sisa = num(l.invTotal) - num(l.lunas) - num(l.discount);
                      return (
                        <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                          <td className={td}>{i + 1}</td>
                          <td className={`${td} w-[90px]`}>
                            <input className={`${tin} w-[90px]`} value={l.no ?? ""} onChange={(e) => setLine(i, { no: e.target.value })} />
                          </td>
                          <td className={td}>IDR</td>
                          <td className={td}><input className={`${tin} w-[70px] font-mono`} value={l.discount ?? "0"} onChange={(e) => setLine(i, { discount: e.target.value })} /></td>
                          <td className={td}><input className={`${tin} w-[80px] font-mono`} value={l.lunas ?? "0"} onChange={(e) => setLine(i, { lunas: e.target.value })} /></td>
                          <td className={`${td} text-right font-mono`}>{l.invTotal}</td>
                          <td className={`${td} text-right font-mono`}>{r2(sisa)}</td>
                          <td className={td} />
                          <td className={td}>{l.tanggal}</td>
                          <td className={td}>{form.vendorId ? vendors.find((v) => v.id === form.vendorId)?.nama : ""}</td>
                          <td className={td}>1.0000</td>
                          <td className={td}><input className="w-[100px] bg-transparent" value={l.catatan ?? ""} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                          <td className={td} />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex items-center justify-between border border-gf-border bg-[#f4f4f4] px-3 py-1 text-[12px]">
                <span className="font-bold tracking-[3px]">T O T A L</span>
                <span>Total Bayar : <b className="font-mono">{totals.bayar}</b></span>
                <span>Total Disc : <b className="font-mono">{totals.disc}</b></span>
                <span>Denda : <b className="font-mono">{totals.denda}</b></span>
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("<< prev")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{"<<"}</button>
                <button onClick={() => setLsel((x) => Math.max(0, x - 1))} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{"<"}</button>
                <button onClick={() => setLsel((x) => Math.min((form.lines?.length ?? 1) - 1, x + 1))} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{">"}</button>
                <button onClick={() => setMsg(">> next")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">{">>"}</button>
                <button onClick={onSimpan} className="gf-3d ml-auto w-[260px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[260px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
            </div>
          </div>
        </div>
      )}

      {pickList && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setPickList(false)}>
          <div className="w-[640px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[13px] font-bold">Tambah dari List — Daftar Hutang</div>
            <div className="max-h-[320px] overflow-auto border border-gf-border bg-white">
              <table className="w-full border-collapse text-[11px]">
                <thead><tr className="bg-gf-menubar">
                  {["No", "Tanggal", "Vendor", "Total", "Dibayar", "Retur", "Sisa", ""].map((h, i) => (
                    <th key={i} className="border border-gf-border px-1 text-left font-normal">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {dh.map((x) => (
                    <tr key={x.id} className="hover:bg-[#e8eef7]">
                      <td className={td}>{x.no}</td>
                      <td className={td}>{x.tanggal}</td>
                      <td className={td}>{x.vendorNama}</td>
                      <td className={`${td} text-right font-mono`}>{x.total}</td>
                      <td className={td} />
                      <td className={td} />
                      <td className={`${td} text-right font-mono`}>{x.sisa}</td>
                      <td className={td}><button onClick={() => addFromDh(x)} className="gf-3d bg-gf-menubar px-2 text-[10px]">Pilih</button></td>
                    </tr>
                  ))}
                  {dh.length === 0 && <tr><td colSpan={8} className="px-2 py-2 text-center text-gf-muted">Tidak ada hutang.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-right"><button onClick={() => setPickList(false)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
