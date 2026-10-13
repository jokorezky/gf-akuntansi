"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Ref = { id: number; nama: string };
type Line = {
  stockId: number; stockNama?: string | null; satuan?: string | null; satuanId?: number | null;
  jumlah?: string | null; harga?: string | null;
  discPers?: string | null; discPers2?: string | null; discPers3?: string | null; discNilai?: string | null;
  nilai?: string | null; catatan?: string | null;
};
type Hdr = {
  id: number; no?: string | null; tanggal?: string | null; vendorId?: number | null; vendorNama?: string | null;
  gudang?: number | null; pembelId?: number | null; pembelId2?: number | null;
  noFakpjk?: string | null; tglFakpjk?: string | null; mauang?: number | null; kurs?: string | null;
  totHarga?: string | null; totDisc?: string | null; discNilai?: string | null;
  ppnTipe?: number | null; ppnPers?: string | null; ppnNilai?: string | null;
  adj01?: string | null; termCrd?: number | null; catatan?: string | null; lines?: Line[];
};

const LF = `stockId stockNama satuan satuanId jumlah harga discPers discPers2 discPers3 discNilai nilai catatan`;
const HF = `id no tanggal vendorId vendorNama gudang pembelId pembelId2 noFakpjk tglFakpjk mauang kurs totHarga totDisc discNilai ppnTipe ppnPers ppnNilai adj01 termCrd catatan`;
const LIST = `query($q:String){ returPembelianList(q:$q){ total rows { ${HF} } } }`;
const REFS = `{ vendorRefList { id nama } itemList(limit:40){ rows { id nama } } }`;
const BYID = `query($id:Int!){ returPembelianById(id:$id){ ${HF} lines { ${LF} } } }`;
const CREATE = `mutation($input:ReturPembelianInput!){ createReturPembelian(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:ReturPembelianInput!){ updateReturPembelian(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteReturPembelian(id:$id) }`;
const ICON = "/gf-icons/screens/pembelian";

const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2);
function lineNilai(l: Line): number {
  const g = num(l.jumlah) * num(l.harga);
  const net = g * (1 - num(l.discPers) / 100) * (1 - num(l.discPers2) / 100) * (1 - num(l.discPers3) / 100);
  return Math.round((net - num(l.discNilai)) * 100) / 100;
}
const emptyLine = (): Line => ({ stockId: 0, jumlah: "1", harga: "0", discPers: "0", discPers2: "0", discPers3: "0", discNilai: "0", catatan: "" });
const empty = (): Hdr => ({
  id: 0, no: "", tanggal: new Date().toISOString().slice(0, 10), vendorId: null, gudang: 1,
  pembelId: null, pembelId2: null, noFakpjk: "", tglFakpjk: "", mauang: 1, kurs: "1.0000",
  discNilai: "0", ppnTipe: 0, ppnPers: "0.00", adj01: "0", termCrd: 0, catatan: "", lines: [emptyLine()],
});

export default function ReturPembelianPage() {
  const [rows, setRows] = useState<Hdr[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [fTanpa, setFTanpa] = useState(true);
  const [fAsal, setFAsal] = useState(true);
  const [fPotong, setFPotong] = useState(true);
  const [fBelum, setFBelum] = useState(true);
  const [fSudah, setFSudah] = useState(true);
  const [vendors, setVendors] = useState<Ref[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [form, setForm] = useState<Hdr | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [lsel, setLsel] = useState(0);
  const [pick, setPick] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ returPembelianList: { total: number; rows: Hdr[] } }>(LIST, { q });
    setRows(d.returPembelianList.rows);
    setTotal(d.returPembelianList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ vendorRefList: Ref[]; itemList: { rows: Ref[] } }>(REFS)
      .then((d) => { setVendors(d.vendorRefList); setItems(d.itemList.rows); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Hdr>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => (f ? { ...f, lines: (f.lines ?? []).map((l, x) => (x === i ? { ...l, ...patch } : l)) } : f));

  const totals = useMemo(() => {
    const lines = form?.lines ?? [];
    let gross = 0, disc = 0;
    for (const l of lines) { const g = num(l.jumlah) * num(l.harga); gross += g; disc += g - lineNilai(l); }
    const totHarga = Math.round(gross * 100) / 100;
    const totDisc = Math.round((disc + num(form?.discNilai)) * 100) / 100;
    const totNilai = Math.round((totHarga - totDisc) * 100) / 100;
    const ppn = num(form?.ppnPers) > 0 ? Math.round(totNilai * num(form?.ppnPers)) / 100 : 0;
    return { totHarga: r2(totHarga), totDisc: r2(totDisc), totNilai: r2(totNilai), ppn: r2(ppn) };
  }, [form]);

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setForm(empty()); setLsel(0); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ returPembelianById: Hdr }>(BYID, { id: sel });
    setMode("edit"); setForm(d.returPembelianById); setLsel(0);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus retur pembelian id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, vendorNama: _vn, totHarga: _th, totDisc: _td, ppnNilai: _pn, ...rest } = form;
      const input = { ...rest, lines: (form.lines ?? []).map((l) => ({ stockId: l.stockId, jumlah: l.jumlah, harga: l.harga, satuan: l.satuanId, discPers: l.discPers, discPers2: l.discPers2, discPers3: l.discPers3, discNilai: l.discNilai, catatan: l.catatan })) };
      if (mode === "create") await gql(CREATE, { input });
      else await gql(UPDATE, { id: form.id, input });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-2 py-[2px]";
  const tin = "w-full bg-transparent text-right";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Retur Pembelian</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut Z..A")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="Z..A" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">P E M B E L I A N&nbsp;&nbsp;-&nbsp;&nbsp;R E T U R&nbsp;&nbsp;P E M B E L I A N</span>
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
          <div className="max-h-[330px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Gudang", "MU", "No Retur", "Tgl Retur", "Vendor", "Kurs", "Harga", "Discount", "PJK/PPN", "%PJK", "Total", "Divisi", "Jenis Pemb", "Catatan"].map((h) => (
                  <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className={td}>{r.id}</td>
                    <td className={td}>{r.gudang}</td>
                    <td className={td}>IDR</td>
                    <td className={td}>{r.no}</td>
                    <td className={td}>{r.tanggal}</td>
                    <td className={td}>{r.vendorNama}</td>
                    <td className={`${td} text-right`}>{r.kurs}</td>
                    <td className={`${td} text-right font-mono`}>{r.totHarga}</td>
                    <td className={`${td} text-right font-mono`}>{r.totDisc}</td>
                    <td className={td}>{r.ppnTipe ? "PJK" : "-"}</td>
                    <td className={`${td} text-right`}>{r.ppnPers}</td>
                    <td className={`${td} text-right font-mono`}>{r2(num(r.totHarga) - num(r.totDisc))}</td>
                    <td className={td} /><td className={td} /><td className={td}>{r.catatan}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={15} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_340px] gap-2">
            <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <span>ID :</span><input className="gf-3d bg-white px-2 py-[1px]" readOnly value={sel ?? ""} />
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Semua Data</label>
              <span>Tanggal :</span><input type="date" className="gf-3d bg-white px-2 py-[1px]" onChange={() => undefined} />
              <span>No :</span><input className="gf-3d bg-white px-2 py-[1px]" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>Vendor :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.vendorNama ?? ""} />
              <span>Catatan :</span><input className="gf-3d col-span-3 bg-white px-2 py-[1px]" readOnly value={rows.find((x) => x.id === sel)?.catatan ?? ""} />
            </div>
            <div className="border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={fTanpa} onChange={(e) => setFTanpa(e.target.checked)} /> Tanpa Asal dan Potong Faktur</label>
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={fAsal} onChange={(e) => setFAsal(e.target.checked)} /> Asal Faktur</label>
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={fPotong} onChange={(e) => setFPotong(e.target.checked)} /> Potong Faktur</label>
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={fBelum} onChange={(e) => setFBelum(e.target.checked)} /> Yang Belum Ada Pelunasan</label>
              <label className="flex items-center gap-1 leading-[18px]"><input type="checkbox" checked={fSudah} onChange={(e) => setFSudah(e.target.checked)} /> Yang Sudah Ada Pelunasan</label>
              <div className="mt-1 flex gap-1">
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
              <span className="text-[13px] font-bold">Retur Pembelian {mode === "edit" ? `#${form.id}` : "[Baru]"}</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 grid grid-cols-[80px_1fr_110px_1fr] items-center gap-x-2 text-[12px]">
                <span>Faktur Asal :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.pembelId ?? ""} onChange={(e) => set({ pembelId: e.target.value ? Number(e.target.value) : null })} />
                <span>Potong pd Faktur :</span>
                <input className="gf-3d bg-white px-2 py-[2px] text-right" value={form.pembelId2 ?? ""} onChange={(e) => set({ pembelId2: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="grid grid-cols-[80px_1fr_80px_230px] gap-x-2 gap-y-1 text-[12px]">
                <span>Vendor :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.vendorId ?? ""} onChange={(e) => set({ vendorId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">*** BELUM DIPILIH ***</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
                <span className="text-right">Gudang :</span>
                <select className="gf-3d bg-white px-1 py-[2px]" value={form.gudang ?? 1} onChange={(e) => set({ gudang: Number(e.target.value) })}>
                  <option value={1}>GUDANG MASTER</option>
                </select>
                <button onClick={() => setMsg("Fak Pjk — isi No Faktur Pajak di samping")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">Fak Pjk</button>
                <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                  <span>Nomor :</span><input className="gf-3d bg-white px-2 py-[2px]" value={form.no ?? ""} onChange={(e) => set({ no: e.target.value })} />
                </div>
                <span className="text-right">No Faktur Pajak :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={form.noFakpjk ?? ""} onChange={(e) => set({ noFakpjk: e.target.value })} />
                <span />
                <div className="grid grid-cols-[60px_1fr] items-center gap-x-1">
                  <span>Tanggal :</span>
                  <div className="flex gap-1">
                    <input type="date" className="gf-3d w-full bg-white px-1 py-[2px]" value={form.tanggal ?? ""} onChange={(e) => set({ tanggal: e.target.value })} />
                    <span className="gf-3d flex-1 bg-[#c8c8f0] px-2 py-[2px] text-[11px] text-center">Selasa, 13 Oktober 2026</span>
                  </div>
                </div>
                <span className="text-right">MU / Kurs :</span>
                <div className="flex items-center gap-1">
                  <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.mauang ?? 1} onChange={(e) => set({ mauang: Number(e.target.value) })}><option value={1}>IDR</option></select>
                  <input className="gf-3d w-[76px] bg-white px-2 py-[2px] text-right" value={form.kurs ?? "1.0000"} onChange={(e) => set({ kurs: e.target.value })} />
                  <span className="text-[11px]">1.0000</span><span className="text-[11px]">1.0000</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1">
                <button onClick={() => setPick(true)} className="gf-3d flex flex-1 items-center gap-1 bg-gf-menubar px-2 py-[2px] text-[11px]">
                  <span className="inline-block h-[12px] w-[12px] border border-gf-border bg-white" /> Tambah Dari Master
                </button>
                <button onClick={() => set({ lines: [...(form.lines ?? []), emptyLine()], id: form.id })} className="gf-3d flex flex-1 items-center gap-1 bg-gf-menubar px-2 py-[2px] text-[11px]">
                  <Image src={`${ICON}/tambah.png`} alt="" width={26} height={22} unoptimized /> Tambah
                </button>
                <button onClick={() => setMsg(`Koreksi baris ${lsel + 1} (edit langsung di grid)`)} className="gf-3d flex flex-1 items-center gap-1 bg-gf-menubar px-2 py-[2px] text-[11px]">
                  <Image src={`${ICON}/koreksi.png`} alt="" width={26} height={22} unoptimized /> Koreksi
                </button>
                <button onClick={() => set({ lines: (form.lines ?? []).filter((_, i) => i !== lsel), id: form.id })} className="gf-3d flex flex-1 items-center gap-1 bg-gf-menubar px-2 py-[2px] text-[11px]">
                  <Image src={`${ICON}/hapus.png`} alt="" width={26} height={22} unoptimized /> Hapus
                </button>
              </div>

              <div className="mt-1 max-h-[240px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0"><tr className="bg-gf-menubar">
                    {["Gudang", "Kode", "Nama", "Jml Retur", "@", "Harga Beli", "Disc%", "Disc%2", "Disc%3", "Nilai", "Catatan"].map((h) => (
                      <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form.lines ?? []).map((l, i) => (
                      <tr key={i} onClick={() => setLsel(i)} className={lsel === i ? "bg-[#e8eef7]" : ""}>
                        <td className={td}>1</td>
                        <td className={`${td} w-[80px]`}><input className={`${tin} w-[80px]`} value={l.stockId || ""} onChange={(e) => setLine(i, { stockId: Number(e.target.value) || 0 })} /></td>
                        <td className={td}>
                          <select className="w-full bg-transparent" value={l.stockId} onChange={(e) => { const it = items.find((x) => x.id === Number(e.target.value)); setLine(i, { stockId: Number(e.target.value), stockNama: it?.nama ?? "" }); }}>
                            <option value={0}>--pilih item--</option>{items.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                          </select>
                        </td>
                        <td className={td}><input className={`${tin} w-[60px]`} value={l.jumlah ?? ""} onChange={(e) => setLine(i, { jumlah: e.target.value })} /></td>
                        <td className={td}>x</td>
                        <td className={td}><input className={`${tin} w-[90px] font-mono`} value={l.harga ?? ""} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[44px]`} value={l.discPers ?? "0"} onChange={(e) => setLine(i, { discPers: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[44px]`} value={l.discPers2 ?? "0"} onChange={(e) => setLine(i, { discPers2: e.target.value })} /></td>
                        <td className={td}><input className={`${tin} w-[44px]`} value={l.discPers3 ?? "0"} onChange={(e) => setLine(i, { discPers3: e.target.value })} /></td>
                        <td className={`${td} text-right font-mono`}>{r2(lineNilai(l))}</td>
                        <td className={td}><input className="w-[120px] bg-transparent" value={l.catatan ?? ""} onChange={(e) => setLine(i, { catatan: e.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 grid grid-cols-[480px_1fr] gap-2">
                <div className="grid grid-cols-[80px_1fr_70px_1fr] items-center gap-x-2 gap-y-[3px] text-[12px]">
                  <span>Catatan :</span>
                  <input className="gf-3d col-span-3 bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
                  <span>Total Nilai :</span>
                  <div className="flex items-center gap-1">
                    <span className="gf-3d w-[90px] bg-[#f0f0a0] px-2 py-[2px] text-right font-mono">{totals.totNilai}</span>
                    <span className="text-[11px]">...</span>
                    <span className="gf-3d w-[90px] bg-[#f0f0a0] px-2 py-[2px] text-right font-mono">{totals.totNilai}</span>
                  </div>
                  <span>Discount :</span>
                  <div className="flex items-center gap-1">
                    <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right font-mono" value={form.discNilai ?? "0"} onChange={(e) => set({ discNilai: e.target.value })} />
                    <span className="text-[11px]">0.00%</span>
                  </div>
                  <span>Total Harga :</span>
                  <div className="flex items-center gap-1">
                    <span className="gf-3d w-[90px] bg-[#f0f0a0] px-2 py-[2px] text-right font-mono">{totals.totHarga}</span>
                    <span className="text-[11px]">...</span>
                    <span className="gf-3d w-[90px] bg-[#f0f0a0] px-2 py-[2px] text-right font-mono">{totals.totHarga}</span>
                  </div>
                  <span>PJK :</span>
                  <div className="flex items-center gap-1">
                    <select className="gf-3d w-[60px] bg-white px-1 py-[2px] text-[11px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                    <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right" value={form.ppnPers ?? "0.00"} onChange={(e) => set({ ppnPers: e.target.value })} />
                    <span className="text-[11px]">0.00%</span>
                  </div>
                  <span>Total Disc :</span>
                  <span className="gf-3d w-[90px] bg-[#f0f0a0] px-2 py-[2px] text-right font-mono">{totals.totDisc}</span>
                  <span>Total Retur :</span>
                  <span className="gf-3d w-[130px] bg-[#f0f0a0] px-2 py-[2px] text-right font-mono">{totals.totNilai}</span>
                </div>
                <div />
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-gf-border pt-2">
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <button onClick={() => setMsg("Credit — menyusul")} className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🟨</button>
                <span className="px-3 tracking-[4px]">C R E D I T</span>
                <button onClick={onSimpan} className="gf-3d ml-auto w-[260px] bg-gf-menubar py-[3px] text-[13px] font-bold">Simpan</button>
                <button onClick={() => setForm(null)} className="gf-3d w-[260px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
              </div>
              <div className="mt-1 text-[11px] text-gf-muted">{form.vendorId ? "" : "Vendor belum dipilih!"}</div>
              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
            </div>
          </div>
        </div>
      )}

      {pick && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setPick(false)}>
          <div className="w-[420px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[13px] font-bold">Tambah Dari Master</div>
            <div className="max-h-[300px] overflow-auto border border-gf-border bg-white">
              {items.map((x) => (
                <button key={x.id} className="block w-full px-2 py-[2px] text-left text-[12px] hover:bg-[#e8eef7]" onClick={() => { set({ lines: [...(form.lines ?? []), { ...emptyLine(), stockId: x.id, stockNama: x.nama }], id: form.id }); setPick(false); }}>
                  {x.id} — {x.nama}
                </button>
              ))}
            </div>
            <div className="mt-2 text-right"><button onClick={() => setPick(false)} className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
