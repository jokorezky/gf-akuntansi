"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  id: number; nama: string; npwp?: string | null; alamat?: string | null; kodePos?: string | null;
  daerahId?: number | null; negara?: string | null; telepon?: string | null; telepon2?: string | null; telepon3?: string | null;
  fax?: string | null; rekening1?: string | null; rekening2?: string | null; rekening3?: string | null;
  email?: string | null; website?: string | null; hubungi?: string | null; hubTelp1?: string | null;
  hubungi2?: string | null; hubTelp2?: string | null; hubungi3?: string | null; hubTelp3?: string | null;
  termCrd?: number | null; muBeli?: number | null; muCredit?: number | null;
  maxCrd?: string | null; maxCrd2?: string | null; max2Crd?: string | null; max2Crd2?: string | null; max3Crd?: string | null;
  ppnTipe?: number | null; ppnPers?: string | null; ppnPersex?: string | null;
  groupVenId?: number | null; divisiId?: number | null; catatan?: string | null; catatan2?: string | null; catatan3?: string | null;
  userLvl?: string | null; updateMf?: number | null; catShow?: boolean | null;
  purreqFrm?: string | null; purcorFrm?: string | null; trmstkFrm?: string | null; pembelFrm?: string | null;
  retpemFrm?: string | null; dbnpemFrm?: string | null; crnpemFrm?: string | null; deppemFrm?: string | null; lpemmaFrm?: string | null;
  pbPurreq?: boolean | null; pbPurcor?: boolean | null; pbTrmstk?: boolean | null; pbCash?: boolean | null; pbCredit?: boolean | null;
  pbCabang?: boolean | null; pbRetcash?: boolean | null; pbRetcrd?: boolean | null; pbDn?: boolean | null; pbCn?: boolean | null;
  pbDeposit?: boolean | null; pbHarLst?: boolean | null;
};
type Ref = { id: number; nama: string };

const FIELDS = `id nama npwp alamat kodePos daerahId negara telepon telepon2 telepon3 fax rekening1 rekening2 rekening3 email website hubungi hubTelp1 hubungi2 hubTelp2 hubungi3 hubTelp3 termCrd muBeli muCredit maxCrd maxCrd2 max2Crd max2Crd2 max3Crd ppnTipe ppnPers ppnPersex groupVenId divisiId catatan catatan2 catatan3 userLvl updateMf catShow purreqFrm purcorFrm trmstkFrm pembelFrm retpemFrm dbnpemFrm crnpemFrm deppemFrm lpemmaFrm pbPurreq pbPurcor pbTrmstk pbCash pbCredit pbCabang pbRetcash pbRetcrd pbDn pbCn pbDeposit pbHarLst`;
const LIST = `query($q:String){ vendorList(q:$q){ total rows { ${FIELDS} } } }`;
const REFS = `{ daerahRefList { id nama } grpvenRefList { id nama } divisiRefList { id nama } }`;
const BYID = `query($id:Int!){ vendorById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:VendorInput!){ createVendor(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:VendorInput!){ updateVendor(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deleteVendor(id:$id) }`;

const empty = (): Row => ({
  id: 0, nama: "", npwp: "", alamat: "", kodePos: "", daerahId: null, negara: "Indonesia",
  telepon: "", telepon2: "", telepon3: "", fax: "", rekening1: "", rekening2: "", rekening3: "",
  email: "", website: "", hubungi: "", hubTelp1: "", hubungi2: "", hubTelp2: "", hubungi3: "", hubTelp3: "",
  termCrd: 0, muBeli: 1, muCredit: 1, maxCrd: "0", maxCrd2: "0", max2Crd: "0", max2Crd2: "0", max3Crd: "0",
  ppnTipe: 0, ppnPers: "0.00", ppnPersex: "0.00",
  groupVenId: null, divisiId: null, catatan: "", catatan2: "", catatan3: "",
  userLvl: null, updateMf: 0, catShow: false,
  pbPurreq: false, pbPurcor: false, pbTrmstk: false, pbCash: false, pbCredit: false, pbCabang: false,
  pbRetcash: false, pbRetcrd: false, pbDn: false, pbCn: false, pbDeposit: false, pbHarLst: false,
});

export default function VendorPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [daerah, setDaerah] = useState<Ref[]>([]);
  const [grpven, setGrpven] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ vendorList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.vendorList.rows); setTotal(d.vendorList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ daerahRefList: Ref[]; grpvenRefList: Ref[]; divisiRefList: Ref[] }>(REFS)
      .then((d) => { setDaerah(d.daerahRefList); setGrpven(d.grpvenRefList); setDivisi(d.divisiRefList); })
      .catch(() => {});
    if (new URLSearchParams(window.location.search).get("auto") === "1") {
      setMode("create");
      setForm(empty());
    }
  }, [load]);

  async function onTambah() { setErr(""); setMode("create"); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    setErr(""); setMode("edit");
    const d = await gql<{ vendorById: Row }>(BYID, { id: sel });
    setForm({ ...empty(), ...d.vendorById });
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus vendor id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel }); setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    if (!form.nama.trim()) return setErr("Nama wajib diisi.");
    setErr("");
    const input: Record<string, unknown> = { nama: form.nama.trim() };
    for (const k of ["npwp", "alamat", "kodePos", "telepon", "telepon2", "telepon3", "fax", "rekening1", "rekening2", "rekening3", "email", "website", "hubungi", "hubTelp1", "maxCrd", "ppnPers", "catatan"] as const) {
      input[k] = (form as Record<string, unknown>)[k] || null;
    }
    for (const k of ["daerahId", "termCrd", "ppnTipe", "groupVenId", "divisiId"] as const) {
      input[k] = (form as Record<string, unknown>)[k] ?? null;
    }
    if (mode === "create") await gql(CREATE, { input });
    else await gql(UPDATE, { id: form.id, input });
    setForm(null); setMsg(mode === "create" ? "Tersimpan." : "Diperbarui."); await load();
  }

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const [tab, setTab] = useState(0);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Vendor</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut A..Z")} className="gf-3d bg-gf-menubar p-[1px]" title="A..Z">
              <Image src="/gf-icons/screens/vendor/a-z.png" alt="A..Z" width={38} height={27} unoptimized />
            </button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]" title="Menu">
              <Image src="/gf-icons/screens/vendor/menu.png" alt="Menu" width={74} height={27} unoptimized />
            </button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;V E N D O R</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]" title="Filter Divisi">
              <option>(-Semua Divisi-)</option>
            </select>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]" title="Laporan">
              <Image src="/gf-icons/screens/vendor/laporan.png" alt="Laporan" width={58} height={44} unoptimized />
            </button>
            <button onClick={() => setMsg("Kelompok (Grouping Vendor) — menyusul")} className="gf-3d bg-gf-menubar p-[1px]" title="Kelompok">
              <Image src="/gf-icons/screens/vendor/kelompok.png" alt="Kelompok" width={57} height={44} unoptimized />
            </button>
            <button onClick={() => setMsg("Sisa Hutang — menyusul")} className="gf-3d bg-gf-menubar p-[1px]" title="Sisa Hutang">
              <Image src="/gf-icons/screens/vendor/sisa-hutang.png" alt="Sisa Hutang" width={61} height={44} unoptimized />
            </button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="" title="Pencarian (ketik untuk mencari)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]" title="Tambah">
              <Image src="/gf-icons/screens/vendor/tambah.png" alt="Tambah" width={58} height={44} unoptimized />
            </button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`} title="Koreksi">
              <Image src="/gf-icons/screens/vendor/koreksi.png" alt="Koreksi" width={58} height={44} unoptimized />
            </button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`} title="Hapus">
              <Image src="/gf-icons/screens/vendor/hapus.png" alt="Hapus" width={58} height={44} unoptimized />
            </button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]" title="Tutup">
              <Image src="/gf-icons/screens/vendor/tutup.png" alt="Tutup" width={56} height={44} unoptimized />
            </button>
          </div>
          <div className="overflow-auto border border-gf-border">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr className="bg-gf-menubar">
                {["ID", "Tipe", "NPWP", "Nama", "Alamat", "Daerah", "Negara", "Telepon", "Telp(2)", "Telp(3)", "Fax", "Rekening"].map((h) => (
                  <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-gf-hl text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.ppnTipe}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.npwp}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.alamat}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{daerah.find((d) => d.id === r.daerahId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">Indonesia</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon2}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon3}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.fax}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.rekening1}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={12} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[11px] text-gf-muted">Total: {total}</div>
        </div>
      </div>

      {msg && <div className="mx-auto mt-2 max-w-[1250px] text-[12px] text-gf-accent">{msg}</div>}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
          <div className="w-[1080px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Vendor</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 grid grid-cols-[70px_120px_70px_1fr] items-center gap-2 text-[12px]">
                <span>ID :</span>
                <span className="border border-gf-border bg-[#ccff99] px-2 py-[2px] font-mono">{mode === "create" ? "???" : form.id}</span>
                <span>Nama :</span>
                <input className="gf-3d bg-white px-2 py-[2px]" value={form.nama} onChange={(e) => set({ nama: e.target.value })} />
              </div>
              <div className="mb-2 flex gap-1 border-b border-gf-border pb-[-1px]">
                {[
                  { icon: "/gf-icons/screens/vendor/tab-data-utama.png", label: "Data Utama" },
                  { icon: "/gf-icons/screens/vendor/tab-inisialisasi.png", label: "Inisialisasi" },
                  { icon: "/gf-icons/screens/vendor/tab-memo.png", label: "Memo" },
                  { icon: "/gf-icons/screens/vendor/tab-link-perkiraan.png", label: "Link Perkiraan" },
                ].map((tb, i) => (
                  <button key={tb.label} onClick={() => setTab(i)}
                    className={`gf-3d flex items-center gap-1 border-b-0 px-3 py-[2px] text-[12px] ${tab === i ? "bg-white" : "bg-gf-menubar"}`}>
                    <Image src={tb.icon} alt="" width={20} height={20} unoptimized />
                    {tb.label}
                  </button>
                ))}
              </div>

              {tab === 0 && (
                <div className="flex gap-2 border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="w-[470px]">
                    <div className="grid grid-cols-[80px_1fr] items-center gap-y-[5px]">
                      <span>Alamat :</span>
                      <textarea className="gf-3d h-[56px] bg-white px-2 py-[2px]" value={form.alamat ?? ""} onChange={(e) => set({ alamat: e.target.value })} />
                      <span>Kode Pos :</span>
                      <input className="gf-3d w-[110px] bg-white px-2 py-[2px]" value={form.kodePos ?? ""} onChange={(e) => set({ kodePos: e.target.value })} />
                      <span>Daerah :</span>
                      <div className="flex gap-1">
                        <select className="gf-3d flex-1 bg-white px-1 py-[2px]" value={form.daerahId ?? ""} onChange={(e) => set({ daerahId: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">--</option>{daerah.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                        </select>
                        <select className="gf-3d w-[150px] bg-white px-1 py-[2px]" value={form.negara ?? "Indonesia"} onChange={(e) => set({ negara: e.target.value })}>
                          <option>Indonesia</option>
                        </select>
                      </div>
                      <span>NPWP :</span>
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.npwp ?? ""} onChange={(e) => set({ npwp: e.target.value })} />
                      <span>Telepon :</span>
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.telepon ?? ""} onChange={(e) => set({ telepon: e.target.value })} />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.telepon2 ?? ""} onChange={(e) => set({ telepon2: e.target.value })} />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.telepon3 ?? ""} onChange={(e) => set({ telepon3: e.target.value })} />
                      <span>Fax :</span>
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.fax ?? ""} onChange={(e) => set({ fax: e.target.value })} />
                      <span>Rekening :</span>
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.rekening1 ?? ""} onChange={(e) => set({ rekening1: e.target.value })} />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.rekening2 ?? ""} onChange={(e) => set({ rekening2: e.target.value })} />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.rekening3 ?? ""} onChange={(e) => set({ rekening3: e.target.value })} />
                      <span>Credit :</span>
                      <div className="flex items-center gap-1">
                        <input type="number" className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right" value={form.termCrd ?? 0} onChange={(e) => set({ termCrd: Number(e.target.value) })} />
                        <span>hari</span>
                      </div>
                      <span>Max Crd :</span>
                      <div className="flex items-center gap-1">
                        <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.muBeli ?? 1} onChange={(e) => set({ muBeli: Number(e.target.value) })}>
                          <option value={1}>IDR</option>
                        </select>
                        <input className="gf-3d flex-1 bg-white px-2 py-[2px] text-right font-mono" value={form.maxCrd ?? "0"} onChange={(e) => set({ maxCrd: e.target.value })} />
                      </div>
                      <span>Pajak :</span>
                      <div className="flex items-center gap-1">
                        <select className="gf-3d w-[70px] bg-white px-1 py-[2px]" value={form.ppnTipe ?? 0} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}>
                          <option value={0}>---</option><option value={1}>PJK</option><option value={2}>NON</option>
                        </select>
                        <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right font-mono" value={form.ppnPers ?? ""} onChange={(e) => set({ ppnPers: e.target.value })} />
                        <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right font-mono" value={form.ppnPersex ?? ""} onChange={(e) => set({ ppnPersex: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="w-[430px]">
                    <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-y-[5px] gap-x-1">
                      <span />
                      <span className="text-center">Hubungi :</span>
                      <span className="text-center">Telepon :</span>
                      <span />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.hubungi ?? ""} onChange={(e) => set({ hubungi: e.target.value })} />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.hubTelp1 ?? ""} onChange={(e) => set({ hubTelp1: e.target.value })} />
                      <span />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.hubungi2 ?? ""} onChange={(e) => set({ hubungi2: e.target.value })} />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.hubTelp2 ?? ""} onChange={(e) => set({ hubTelp2: e.target.value })} />
                      <span />
                      <span />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.hubungi3 ?? ""} onChange={(e) => set({ hubungi3: e.target.value })} />
                      <input className="gf-3d bg-white px-2 py-[2px]" value={form.hubTelp3 ?? ""} onChange={(e) => set({ hubTelp3: e.target.value })} />
                      <span />
                      <span className="col-span-4 grid grid-cols-[70px_1fr] items-center gap-y-[5px]">
                        <span>Email :</span>
                        <input className="gf-3d bg-white px-2 py-[2px]" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
                        <span>Website :</span>
                        <div className="flex items-center gap-1"><span className="text-[11px]">http://</span>
                          <input className="gf-3d flex-1 bg-white px-2 py-[2px]" value={form.website ?? ""} onChange={(e) => set({ website: e.target.value })} />
                        </div>
                        <span>Kelompok :</span>
                        <select className="gf-3d bg-white px-1 py-[2px]" value={form.groupVenId ?? ""} onChange={(e) => set({ groupVenId: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">--</option>{grpven.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                        </select>
                        <span>Divisi :</span>
                        <select className="gf-3d bg-white px-1 py-[2px]" value={form.divisiId ?? ""} onChange={(e) => set({ divisiId: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">--Semua Divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                        </select>
                        <span className="col-span-2 text-right text-[11px]">Default Trans.Pembelian :</span>
                        <span className="col-span-2 flex gap-1">
                          <select className="gf-3d w-[80px] bg-white px-1 py-[2px]"><option>--</option></select>
                          <select className="gf-3d w-[80px] bg-white px-1 py-[2px]"><option>--</option></select>
                        </span>
                        <label className="col-span-2 flex items-center gap-1 text-[11px]">
                          <input type="checkbox" checked={Boolean(form.pbHarLst)} onChange={(e) => set({ pbHarLst: e.target.checked })} />
                          Pembelian: Harga Beli diambil dari Harga Beli terakhir
                        </label>
                      </span>
                    </div>
                  </div>
                  <div className="w-[150px] border border-gf-border bg-white">
                    <div className="border-b border-gf-border bg-[#f0f0f0] px-1 text-[11px]">Transaksi</div>
                    <div className="h-[150px] overflow-auto p-1">
                      {([["Purchase Order", "pbPurcor"], ["Pembelian Request", "pbPurreq"], ["Pembelian Cash", "pbCash"], ["Pembelian Credit", "pbCredit"], ["Pembelian Antar Cabang", "pbCabang"], ["Retur Pembelian Cash", "pbRetcash"], ["Retur Pembelian Credit", "pbRetcrd"], ["Debit Note", "pbDn"], ["Credit Note", "pbCn"], ["Deposit", "pbDeposit"]] as [string, keyof Row][]).map(([label, k]) => (
                        <label key={k} className="flex items-center gap-1 text-[10px] leading-[14px]">
                          <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => set({ [k]: e.target.checked } as Partial<Row>)} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div className="border-y border-gf-border bg-[#f0f0f0] px-1 text-[11px]">User Level</div>
                    <div className="p-1">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <label key={n} className="flex items-center gap-1 text-[10px] leading-[15px]">
                          <input type="checkbox" checked={String(form.userLvl ?? "") === String(n)} onChange={(e) => set({ userLvl: e.target.checked ? String(n) : null })} />
                          User Level {n}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 1 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-1 flex items-center justify-between">
                    <span>Catatan :</span>
                    <button
                      onClick={() => set({ catShow: !form.catShow })}
                      className={`gf-3d px-2 py-[2px] text-[11px] ${form.catShow ? "bg-gf-hl text-white" : "bg-gf-panel"}`}
                    >
                      Catatan ditampilkan setiap pemilihan vendor
                    </button>
                  </div>
                  <textarea className="gf-3d h-[240px] w-full bg-white px-2 py-[2px]" value={form.catatan ?? ""} onChange={(e) => set({ catatan: e.target.value })} />
                </div>
              )}

              {tab === 2 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3">
                  <textarea className="gf-3d mb-1 h-[130px] w-full bg-white px-2 py-[2px] text-[12px]" value={form.catatan2 ?? ""} onChange={(e) => set({ catatan2: e.target.value })} />
                  <textarea className="gf-3d h-[130px] w-full bg-white px-2 py-[2px] text-[12px]" value={form.catatan3 ?? ""} onChange={(e) => set({ catatan3: e.target.value })} />
                </div>
              )}

              {tab === 3 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-2 border border-gf-border bg-white px-2 py-[3px] text-[11px]">
                    Diisi apabila anda ingin link perkiraan yang berbeda untuk transaksi dengan mata uang tertentu.
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Untuk Transaksi Mata Uang :</span>
                    <select className="gf-3d w-[110px] bg-white px-1 py-[2px]"><option>---</option><option>IDR</option></select>
                    <span>Divisi :</span>
                    <select className="gf-3d w-[170px] bg-white px-1 py-[2px]">
                      <option value="">--Semua Divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                    </select>
                  </div>
                  <div className="mt-2 text-[11px] text-gf-muted">(Link perkiraan per mata uang — grid akun menyusul pada pass berikutnya)</div>
                </div>
              )}

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={onSimpan} className="gf-3d flex items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
                  <Image src="/gf-icons/screens/vendor/simpan.png" alt="" width={22} height={22} unoptimized />
                  Simpan
                </button>
                <button onClick={() => setForm(null)} className="gf-3d flex items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
                  <Image src="/gf-icons/screens/vendor/form-tutup.png" alt="" width={22} height={22} unoptimized />
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-2"><span className="w-[80px] shrink-0">{label}</span>{children}</div>;
}
