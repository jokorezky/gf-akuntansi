"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = Record<string, string | number | boolean | null | undefined> & { id: number; nama: string };
type Ref = { id: number; nama: string };

const FIELDS = "id nama barcode nama2 vendorId groupStkId jenis hargaBeli hargaJual1 hargaJual2 hargaJual3 hargaJual4 hargaJual5 minStock tipeSatu satDef nonPajak expired catatan kode satEcr kursJual satBeli satMin minJual minJlSt satJ01 satJ02 satJ03 satJ04 satJ05";
const LIST = `query($q:String){ itemList(q:$q){ total rows { ${FIELDS} } } }`;
const REFS = `{ grpstkRefList { id nama } vendorRefList { id nama } }`;
const BYID = `query($id:Int!){ itemById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:ItemInput!){ createItem(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!, $input:ItemInput!){ updateItem(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteItem(id:$id) }`;
const ICON = "/gf-icons/screens/item";

const empty = (): Row => ({ id: 0, nama: "", barcode: "", nama2: "", vendorId: null, groupStkId: null, jenis: 0, hargaBeli: "0.00", hargaJual1: "0.00", hargaJual2: "0.00", hargaJual3: "0.00", hargaJual4: "0.00", hargaJual5: "0.00", minStock: "0", tipeSatu: 0, satDef: 0, satEcr: 0, kursJual: 1, satBeli: 0, satMin: 0, minJual: "0.00", minJlSt: 0, satJ01: 0, satJ02: 0, satJ03: 0, satJ04: 0, satJ05: 0, expired: false, nonPajak: false, catatan: "" });

const TABS = [
  { icon: "tab-data-utama", label: "Data Utama" },
  { icon: "tab-inisialisasi", label: "Inisialisasi" },
  { icon: "tab-lainnya", label: "Lainnya" },
  { icon: "tab-gambar", label: "Gambar" },
  { icon: "tab-sub-info", label: "Sub Info" },
  { icon: "tab-link", label: "Link Perkiraan" },
];

const HARGA_ROWS: { label: string; hk: string; sk: string }[] = [
  { label: "Harga Beli", hk: "hargaBeli", sk: "satBeli" },
  { label: "Harga Jual *1", hk: "hargaJual1", sk: "satJ01" },
  { label: "Harga Jual *2", hk: "hargaJual2", sk: "satJ02" },
  { label: "Harga Jual *3", hk: "hargaJual3", sk: "satJ03" },
  { label: "Harga Jual *4", hk: "hargaJual4", sk: "satJ04" },
  { label: "Harga Jual *5", hk: "hargaJual5", sk: "satJ05" },
  { label: "Min H-Jual", hk: "minJual", sk: "minJlSt" },
];

export default function ItemPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [grpstk, setGrpstk] = useState<Ref[]>([]);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [tab, setTab] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ itemList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.itemList.rows);
    setTotal(d.itemList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ grpstkRefList: Ref[]; vendorRefList: Ref[] }>(REFS)
      .then((d) => { setGrpstk(d.grpstkRefList); setVendors(d.vendorRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setTab(0); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ itemById: Row }>(BYID, { id: sel });
    setMode("edit"); setTab(0); setForm(d.itemById);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus item id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, kode: _kode, ...rest } = form;
      if (mode === "create") await gql(CREATE, { input: rest });
      else await gql(UPDATE, { id: form.id, input: rest });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const lbl = "text-[11px]";
  const inp = "gf-3d w-full bg-white px-2 py-[2px] text-[12px]";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Item</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut A..Z")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="A..Z" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;I T E M</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
          </div>
          <div className="mb-2 flex items-center gap-1">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/laporan.png`} alt="Laporan" width={54} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Satuan — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/satuan.png`} alt="Satuan" width={49} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Kelompok (Grouping Item) — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/kelompok.png`} alt="Kelompok" width={48} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/master/sisa-stock"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/sisa-stock.png`} alt="Sisa Stock" width={49} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Gabungan — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/gabungan.png`} alt="Gabungan" width={48} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/cetak.png`} alt="Cetak" width={47} height={44} unoptimized /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tambah.png`} alt="Tambah" width={54} height={44} unoptimized /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={54} height={44} unoptimized /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/hapus.png`} alt="Hapus" width={54} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup.png`} alt="Tutup" width={58} height={44} unoptimized /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[420px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["Group", "Vendor", "Kode", "Nama", "Tipe Satuan", "Sat/Ecr", "Jenis", "Harga Beli", "Harga Jual #1", "#2", "#3", "#4", "#5"].map((h) => (
                  <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{grpstk.find((g) => g.id === r.groupStkId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{vendors.find((v) => v.id === r.vendorId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.kode}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tipeSatu}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.satEcr}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.jenis}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaBeli}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual1}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual2}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual3}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual4}</td>
                    <td className="border border-gf-border px-2 py-[2px] text-right font-mono">{r.hargaJual5}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={13} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div className="w-[1160px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Item {mode === "edit" ? `[${form.nama}]` : "[Record Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 grid grid-cols-[60px_1fr_60px_1fr_60px_1fr_70px_150px] items-center gap-1 text-[12px]">
                <span>Nama :</span><input className={inp} value={form.nama} onChange={(e) => set({ nama: e.target.value })} />
                <span />
                <input className={inp} value={String(form.nama2 ?? "")} onChange={(e) => set({ nama2: e.target.value })} />
                <span />
                <input className={inp} value={String(form.kode ?? "")} onChange={(e) => set({ kode: e.target.value })} />
                <span>Jenis :</span>
                <select className={inp} value={Number(form.jenis ?? 0)} onChange={(e) => set({ jenis: Number(e.target.value) })}>
                  <option value={0}>Stock</option><option value={1}>Servis/Non-Stock</option><option value={2}>Link Stock</option><option value={3}>Link Multiple Stock</option>
                </select>
              </div>
              <div className="mb-2 flex gap-1">
                {TABS.map((tb, i) => (
                  <button key={tb.label} onClick={() => setTab(i)} className={`gf-3d flex items-center gap-1 px-2 py-[2px] text-[11px] ${tab === i ? "bg-white" : "bg-gf-menubar"}`}>
                    <Image src={`${ICON}/${tb.icon}.png`} alt="" width={18} height={18} unoptimized />
                    {tb.label}
                  </button>
                ))}
              </div>

              {tab === 0 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="grid grid-cols-[70px_1fr_70px_1fr_70px_1fr] items-center gap-x-2 gap-y-1">
                    <span className={lbl}>Group :</span>
                    <select className={inp} value={Number(form.groupStkId ?? 0)} onChange={(e) => set({ groupStkId: Number(e.target.value) || null })}>
                      <option value={0}>--belum dipilih--</option>{grpstk.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                    </select>
                    <span className={lbl}>Kode :</span>
                    <input className={inp} value={String(form.kode ?? "")} onChange={(e) => set({ kode: e.target.value })} />
                    <span className={lbl}>Barcode :</span>
                    <input className={inp} value={String(form.barcode ?? "")} onChange={(e) => set({ barcode: e.target.value })} />
                    <span className={lbl}>Vendor :</span>
                    <select className={inp} value={Number(form.vendorId ?? 0)} onChange={(e) => set({ vendorId: Number(e.target.value) || null })}>
                      <option value={0}>--</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                    </select>
                    <span className={lbl}>Satuan :</span>
                    <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.satDef ?? 0)} onChange={(e) => set({ satDef: Number(e.target.value) || 0 })} />
                    <span className={lbl}>Dec :</span>
                    <input className="gf-3d w-[60px] bg-white px-2 py-[2px] text-right text-[12px]" value="2" readOnly />
                    <span />
                    <span className="flex items-center gap-2">
                      <span className={lbl}>Min Stock :</span>
                      <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.minStock ?? "0")} onChange={(e) => set({ minStock: e.target.value })} />
                      <span className={lbl}>unit</span>
                      <input className="gf-3d w-[60px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.satMin ?? 0)} onChange={(e) => set({ satMin: Number(e.target.value) || 0 })} />
                      <label className="ml-3 flex items-center gap-1"><input type="checkbox" checked={Boolean(form.expired)} onChange={(e) => set({ expired: e.target.checked })} /> Input Expired</label>
                    </span>
                    <span className={lbl}>Sat/Eceran :</span>
                    <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.satEcr ?? 0)} onChange={(e) => set({ satEcr: Number(e.target.value) || 0 })} />
                    <span className={lbl}>Kurs Jual *1 :</span>
                    <input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.kursJual ?? 1)} onChange={(e) => set({ kursJual: Number(e.target.value) || 0 })} />
                    <span />
                    <span className="text-[11px] text-gf-muted">(Tipe Satuan: {String(form.tipeSatu ?? 0)} · Non Pajak: {form.nonPajak ? "Ya" : "Tidak"})</span>
                  </div>

                  <div className="mt-2 grid grid-cols-[1fr_260px] gap-2">
                    <div>
                      <div className="border border-gf-border bg-white">
                        <table className="w-full border-collapse text-[11px]">
                          <thead><tr className="bg-gf-menubar">
                            {["KETERANGAN", "MU", "HARGA", "SET%", "PER", "SAT", "DISC%", "DISC2..", "%", "%2", "NILAI-IDR"].map((h) => (
                              <th key={h} className="border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {HARGA_ROWS.map((hr) => (
                              <tr key={hr.hk}>
                                <td className="border border-gf-border px-1 py-[1px]">{hr.label}</td>
                                <td className="border border-gf-border px-1 py-[1px]">IDR</td>
                                <td className="border border-gf-border px-1 py-[1px]">
                                  <input className="w-full bg-white px-1 py-[1px] text-right text-[11px]" value={String(form[hr.hk] ?? "0.00")} onChange={(e) => set({ [hr.hk]: e.target.value })} />
                                </td>
                                <td className="border border-gf-border px-1 py-[1px] text-right">0,00%</td>
                                <td className="border border-gf-border px-1 py-[1px] text-right">1</td>
                                <td className="border border-gf-border px-1 py-[1px]">
                                  <input className="w-[46px] bg-white px-1 py-[1px] text-right text-[11px]" value={String(form[hr.sk] ?? 0)} onChange={(e) => set({ [hr.sk]: Number(e.target.value) || 0 })} />
                                </td>
                                <td className="border border-gf-border px-1 py-[1px] text-right">0,00%</td>
                                <td className="border border-gf-border px-1 py-[1px]" /><td className="border border-gf-border px-1 py-[1px] text-right">0,00%</td>
                                <td className="border border-gf-border px-1 py-[1px] text-right">0,00%</td>
                                <td className="border border-gf-border px-1 py-[1px] text-right font-mono">{String(form[hr.hk] ?? "0")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="border border-gf-border bg-white">
                      <div className="bg-gf-menubar px-1 text-[11px]">KONVERSI</div>
                      <table className="w-full border-collapse text-[11px]">
                        <thead><tr><th className="border border-gf-border px-1 text-left font-normal">NO.</th><th className="border border-gf-border px-1 text-left font-normal">SATUAN</th><th className="border border-gf-border px-1 text-left font-normal">KONVERSI</th></tr></thead>
                        <tbody>
                          {[["BKS", "1 BKS"], ["SLOP", "10 BKS"], ["BOX", "100 BKS"], ["4.", "="], ["5.", "="], ["6.", "="]].map(([s, k], i) => (
                            <tr key={i}><td className="border border-gf-border px-1">{i + 1}.</td><td className="border border-gf-border px-1">{s}</td><td className="border border-gf-border px-1">{k}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {tab === 1 && (
                <div className="grid grid-cols-[120px_1fr] items-center gap-x-2 gap-y-1 border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <span className={lbl}>EQUIVALEN ITEM :</span>
                  <input className={inp} placeholder="(belum dipetakan ke kolom DB — pass berikutnya)" readOnly />
                  <span className={lbl}>KELOMPOK II :</span>
                  <input className={inp} placeholder="(Group II — pass berikutnya)" readOnly />
                  <span className={lbl}>NAMA ALIAS :</span>
                  <input className={inp} value={String(form.nama2 ?? "")} onChange={(e) => set({ nama2: e.target.value })} />
                </div>
              )}

              {tab === 2 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="mb-1">
                      <div className="text-[11px] text-gf-muted">No. {n} <span className="float-right">Sisa: 250 karakter</span></div>
                      <textarea className="gf-3d h-[52px] w-full bg-white px-2 py-[2px] text-[12px]" placeholder={`(memo ${n} — kolom DB belum dipetakan, pass berikutnya)`} readOnly />
                    </div>
                  ))}
                </div>
              )}

              {tab === 3 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-2 border border-gf-border bg-white px-2 py-[3px] text-[11px]">Diisi apabila anda ingin link perkiraan yang berbeda dengan Default Link Perkiraan yang telah diset perusahaan.</div>
                  <div className="flex items-center gap-2"><span className={lbl}>Persediaan :</span><select className="gf-3d w-[300px] bg-white px-1 py-[2px] text-[11px]"><option>--</option></select></div>
                  <div className="mt-2 text-[11px] text-gf-muted">(Gambar produk — upload gambar pada pass berikutnya)</div>
                </div>
              )}

              {tab === 4 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="border border-gf-border bg-white px-2 py-[3px] text-[11px]">Sub info item (pass berikutnya — bukti scan item-form-sub-info.png tersimpan).</div>
                </div>
              )}

              {tab === 5 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-2 border border-gf-border bg-white px-2 py-[3px] text-[11px]">Diisi apabila anda ingin link perkiraan yang berbeda dengan Default Link Perkiraan yang telah diset perusahaan.</div>
                  <div className="mb-1 flex gap-1">
                    {["General", "Pembelian", "Penjualan"].map((t, i) => (
                      <button key={t} className={`gf-3d px-2 py-[1px] text-[11px] ${i === 0 ? "bg-white" : "bg-gf-menubar"}`}>{t}</button>
                    ))}
                  </div>
                  <div className="mb-1 flex items-center gap-2"><span className={lbl}>Persediaan :</span><select className="gf-3d w-[300px] bg-white px-1 py-[2px] text-[11px]"><option>--</option></select></div>
                  <div className="mb-1 border border-gf-border bg-[#c8f0c8] px-2 py-[2px] text-[11px] text-green-800">Diisi apabila anda ingin link perkiraan yang berbeda (1 Gudang = 1 Kode Perkiraan Persediaan) ...</div>
                  <table className="w-full border-collapse bg-white text-[11px]">
                    <thead><tr className="bg-gf-menubar">
                      {["No", "Gudang", "Kode", "MU", "Perkiraan Persediaan"].map((h) => <th key={h} className="border border-gf-border px-1 text-left font-normal">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[1, 2, 3].map((n) => (
                        <tr key={n}><td className="border border-gf-border px-1">{n}</td><td className="border border-gf-border px-1" /><td className="border border-gf-border px-1" /><td className="border border-gf-border px-1" /><td className="border border-gf-border px-1" /></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={Boolean(form.nonPajak)} onChange={(e) => set({ nonPajak: e.target.checked })} /> Non Pajak</label>
                <button onClick={() => setMsg("Cari")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🔍</button>
                <input className="gf-3d w-[140px] bg-white px-2 py-[2px] text-[12px]" placeholder="Group H.JL" readOnly />
                <button onClick={onSimpan} className="gf-3d ml-auto flex w-[40%] items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
                  <Image src={`${ICON}/simpan.png`} alt="" width={20} height={20} unoptimized /> Simpan (F12)
                </button>
                <button onClick={() => setForm(null)} className="gf-3d flex w-[40%] items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
                  <Image src={`${ICON}/form-tutup.png`} alt="" width={20} height={20} unoptimized /> Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
