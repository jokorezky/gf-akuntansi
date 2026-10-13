"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = Record<string, string | number | boolean | null | undefined> & { id: number; nama: string };
type Ref = { id: number; nama: string };

const FIELDS = "id tipe tglDaftar nonAktif kode title nama alamat kodePos daerahId daerah2Id npwp npwpNama npwpAlamat telepon telepon2 telepon3 fax email website hubungi hubTelp1 hubungi2 hubTelp2 hubungi3 hubTelp3 termCrd termCrdex spsDisc discPri muCredit muJual maxCrd maxCrd2 max2Crd max2Crd2 max3Crd tanpaCrdc blackList pjHarLst pelGabung catShow groupPelId groupPe2Id jenpenId fakpjkNo salesId collectorId divisiId grphjlId hargaJual ppnTipe ppnPers ppnPersex setadj1per setadj2per setadj3per setadj4per setadj5per setadj1nil setadj2nil setadj3nil setadj4nil setadj5nil stsPers agama noKtp jenisKel tmpLahir tglLahir pendAkhir krmNama krmAlamat userLvl catatan";
const LIST = `query($q:String){ pelangganList(q:$q){ total rows { ${FIELDS} } } }`;
const REFS = `{ daerahRefList { id nama } jenpenRefList { id nama } divisiRefList { id nama } grpvenRefList { id nama } }`;
const BYID = `query($id:Int!){ pelangganById(id:$id){ ${FIELDS} } }`;
const CREATE = `mutation($input:PelangganInput!){ createPelanggan(input:$input){ id } }`;
const UPDATE = `mutation($id:Int!,$input:PelangganInput!){ updatePelanggan(id:$id, input:$input){ id } }`;
const DELETE = `mutation($id:Int!){ deletePelanggan(id:$id) }`;
const ICON = "/gf-icons/screens/pelanggan";

const empty = (): Row => ({ id: 0, nama: "", kode: "", alamat: "", tipe: 0, kota: undefined, title: 0, negara: 1, catShow: false, tanpaCrdc: false, blackList: false, pjHarLst: false, pelGabung: false, termCrd: 0, termCrdex: 0, ppnTipe: 0, ppnPers: "0.00", ppnPersex: "0.00", userLvl: null, jenisKel: 0, agama: 0, setadj1per: "0.00", setadj2per: "0.00", setadj3per: "0.00", setadj4per: "0.00", setadj5per: "0.00", setadj1nil: "0.00", setadj2nil: "0.00", setadj3nil: "0.00", setadj4nil: "0.00", setadj5nil: "0.00" });

const TABS = [
  { icon: "tab-data-utama", label: "Data Utama" },
  { icon: "tab-inis1", label: "Inisialisasi *1" },
  { icon: "tab-inis2", label: "Inisialisasi *2" },
  { icon: "tab-harga", label: "Harga Barang Spesial" },
  { icon: "tab-extra", label: "Extra Info" },
  { icon: "tab-personal", label: "Data Personal" },
  { icon: "tab-link", label: "Link Perkiraan" },
];

export default function PelangganPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [daerah, setDaerah] = useState<Ref[]>([]);
  const [jenpen, setJenpen] = useState<Ref[]>([]);
  const [divisi, setDivisi] = useState<Ref[]>([]);
  const [grpven, setGrpven] = useState<Ref[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [tab, setTab] = useState(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ pelangganList: { total: number; rows: Row[] } }>(LIST, { q });
    setRows(d.pelangganList.rows);
    setTotal(d.pelangganList.total);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    gql<{ daerahRefList: Ref[]; jenpenRefList: Ref[]; divisiRefList: Ref[]; grpvenRefList: Ref[] }>(REFS)
      .then((d) => { setDaerah(d.daerahRefList); setJenpen(d.jenpenRefList); setDivisi(d.divisiRefList); setGrpven(d.grpvenRefList); })
      .catch(() => undefined);
  }, [load]);

  const set = (patch: Partial<Row>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onTambah() { setErr(""); setMsg(""); setMode("create"); setTab(0); setForm(empty()); }
  async function onKoreksi() {
    if (sel == null) return setMsg("Pilih baris dulu (Koreksi).");
    const d = await gql<{ pelangganById: Row }>(BYID, { id: sel });
    setMode("edit"); setTab(0); setForm(d.pelangganById);
  }
  async function onHapus() {
    if (sel == null) return setMsg("Pilih baris dulu (Hapus).");
    if (!confirm(`Hapus pelanggan id ${sel}? (soft delete)`)) return;
    await gql(DELETE, { id: sel });
    setSel(null); setMsg("Terhapus."); await load();
  }
  async function onSimpan() {
    if (!form) return;
    setErr("");
    try {
      const { id: _id, ...rest } = form;
      if (mode === "create") await gql(CREATE, { input: rest });
      else await gql(UPDATE, { id: form.id, input: rest });
      setForm(null); setMsg("Tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const lbl = "text-[11px]";
  const inp = "gf-3d w-full bg-white px-2 py-[2px] text-[12px]";
  const row = "grid grid-cols-[76px_1fr] items-center gap-y-[5px] gap-x-1";

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Pelanggan</div>
        <div className="p-2">
          <div className="mb-1 flex items-center gap-1">
            <button onClick={() => setMsg("Urut A..Z")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/a-z.png`} alt="A..Z" width={38} height={27} unoptimized /></button>
            <button onClick={() => setMsg("Menu")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/menu.png`} alt="Menu" width={74} height={27} unoptimized /></button>
            <span className="mx-auto text-[12px] font-bold tracking-widest text-gf-accent">M A S T E R&nbsp;&nbsp;F I L E&nbsp;&nbsp;-&nbsp;&nbsp;P E L A N G G A N</span>
            <select className="gf-3d bg-white px-1 py-[2px] text-[11px]"><option>(-Semua Divisi-)</option></select>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button onClick={() => { window.location.href = "/laporan"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/laporan.png`} alt="Laporan" width={58} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Kelompok (Grouping Pelanggan) — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/kelompok.png`} alt="Kelompok" width={57} height={44} unoptimized /></button>
            <button onClick={() => setMsg("Sisa Piutang — menyusul")} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/sisa-piutang.png`} alt="Sisa Piutang" width={62} height={44} unoptimized /></button>
            <input className="gf-3d flex-1 bg-white px-2 py-[3px] text-[12px]" placeholder="Cari nama / kode..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={onTambah} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tambah.png`} alt="Tambah" width={62} height={44} unoptimized /></button>
            <button onClick={onKoreksi} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/koreksi.png`} alt="Koreksi" width={62} height={44} unoptimized /></button>
            <button onClick={onHapus} className={`gf-3d bg-gf-menubar p-[1px] ${sel == null ? "opacity-40" : ""}`}><Image src={`${ICON}/hapus.png`} alt="Hapus" width={62} height={44} unoptimized /></button>
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d bg-gf-menubar p-[1px]"><Image src={`${ICON}/tutup.png`} alt="Tutup" width={62} height={44} unoptimized /></button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}
          <div className="max-h-[430px] overflow-auto border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0"><tr className="bg-gf-menubar">
                {["ID", "Tipe", "Tanggal", "Non-Aktif", "NPWP", "Title", "Nama", "Alamat", "Daerah", "Negara", "Telepon", "Telp(2)", "Telp(3)"].map((h) => (
                  <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                    <td className="border border-gf-border px-2 py-[2px]">{r.id}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{["-", "Corporate", "Personal", "Gabungan"][Number(r.tipe ?? 0)] ?? r.tipe}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.tglDaftar}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nonAktif}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.npwp}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.title}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.nama}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.alamat}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{daerah.find((d) => d.id === r.daerahId)?.nama ?? ""}</td>
                    <td className="border border-gf-border px-2 py-[2px]">Indonesia</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon2}</td>
                    <td className="border border-gf-border px-2 py-[2px]">{r.telepon3}</td>
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
          <div className="w-[1140px] border border-gf-border bg-gf-panel shadow-lg">
            <div className="flex items-center justify-between border-b border-gf-border bg-gf-titlebar px-2 py-1">
              <span className="text-[13px] font-bold">Pelanggan</span>
              <button className="gf-3d bg-gf-panel px-2 text-[11px]" onClick={() => setForm(null)}>✕</button>
            </div>
            <div className="p-2">
              <div className="mb-1 grid grid-cols-[70px_130px_60px_90px_55px_1fr] items-center gap-2 text-[12px]">
                <span>Tanggal :</span>
                <input type="date" className={inp} value={String(form.tglDaftar ?? "")} onChange={(e) => set({ tglDaftar: e.target.value })} />
                <span>Non-aktif :</span>
                <input type="date" className={inp} value={String(form.nonAktif ?? "")} onChange={(e) => set({ nonAktif: e.target.value })} />
                <span>Kode :</span>
                <input className={inp} value={String(form.kode ?? "")} onChange={(e) => set({ kode: e.target.value })} />
                <span>ID :</span>
                <input className="gf-3d w-[110px] bg-[#ccff99] px-2 py-[2px] font-mono text-[12px]" readOnly value={mode === "create" ? "???" : form.id} />
                <span>Nama :</span>
                <input className={`${inp} col-span-3`} value={form.nama} onChange={(e) => set({ nama: e.target.value })} />
                <span className="col-span-6 grid grid-cols-3 gap-1 border border-gf-border bg-[#f4f4f4] p-2 text-[11px]">
                  {([["tipe", 1, "Corporate / Perusahaan"], ["tipe", 2, "Personal / Perorangan"], ["tipe", 3, "Gabungan dari beberapa pelanggan eceran"]] as [string, number, string][]).map(([k, v, l], idx) => (
                    <label key={idx} className="flex items-center gap-1">
                      <input type="checkbox" checked={Number(form[k]) === v} onChange={(e) => set({ [k]: e.target.checked ? v : 0 })} /> {l}
                    </label>
                  ))}
                  <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(form.pjHarLst)} onChange={(e) => set({ pjHarLst: e.target.checked })} /> Penjualan: Harga Jual diambil dari Harga Jual terakhir</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(form.blackList)} onChange={(e) => set({ blackList: e.target.checked })} /> Pelanggan diblack list..</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(form.tanpaCrdc)} onChange={(e) => set({ tanpaCrdc: e.target.checked })} /> Tanpa cek limit saat Simpan Penjualan</label>
                </span>
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
                <div className="grid grid-cols-3 gap-2 border border-gf-border bg-[#f4f4f4] p-3">
                  <div className={row}>
                    <span className={lbl}>Title :</span>
                    <select className={inp} value={Number(form.title ?? 0)} onChange={(e) => set({ title: Number(e.target.value) })}>
                      <option value={0}>--</option><option value={1}>Bpk</option><option value={2}>Ibu</option><option value={3}>Sdr</option><option value={4}>PT</option>
                    </select>
                    <span className={lbl}>Alamat :</span>
                    <textarea className="gf-3d h-[56px] bg-white px-2 py-[2px] text-[12px]" value={String(form.alamat ?? "")} onChange={(e) => set({ alamat: e.target.value })} />
                    <span className={lbl}>Kode Pos :</span>
                    <input className={inp} value={String(form.kodePos ?? "")} onChange={(e) => set({ kodePos: e.target.value })} />
                    <span className={lbl}>Daerah :</span>
                    <div className="flex gap-1">
                      <select className={inp} value={Number(form.daerahId ?? 0)} onChange={(e) => set({ daerahId: Number(e.target.value) || null })}>
                        <option value={0}>--</option>{daerah.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                      </select>
                      <select className={inp} value={Number(form.daerah2Id ?? 0)} onChange={(e) => set({ daerah2Id: Number(e.target.value) || null })}>
                        <option value={0}>--</option>{daerah.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                      </select>
                    </div>
                    <span className={lbl}>Negara :</span>
                    <select className={inp} value={Number(form.negara ?? 1)} onChange={(e) => set({ negara: Number(e.target.value) })}><option value={1}>Indonesia</option></select>
                    <span className={lbl}>NPWP :</span>
                    <input className={inp} value={String(form.npwp ?? "")} onChange={(e) => set({ npwp: e.target.value })} />
                    <span className={lbl}>Pemilik :</span>
                    <input className={inp} value={String(form.npwpNama ?? "")} onChange={(e) => set({ npwpNama: e.target.value })} />
                    <span className={lbl}>Alamat :</span>
                    <input className={inp} value={String(form.npwpAlamat ?? "")} onChange={(e) => set({ npwpAlamat: e.target.value })} />
                    <span className={lbl}>Telepon :</span>
                    <input className={inp} value={String(form.telepon ?? "")} onChange={(e) => set({ telepon: e.target.value })} />
                    <span /><input className={inp} value={String(form.telepon2 ?? "")} onChange={(e) => set({ telepon2: e.target.value })} />
                    <span /><input className={inp} value={String(form.telepon3 ?? "")} onChange={(e) => set({ telepon3: e.target.value })} />
                    <span className={lbl}>Fax :</span>
                    <input className={inp} value={String(form.fax ?? "")} onChange={(e) => set({ fax: e.target.value })} />
                    <span className={lbl}>Email :</span>
                    <input className={inp} value={String(form.email ?? "")} onChange={(e) => set({ email: e.target.value })} />
                    <span className={lbl}>Website :</span>
                    <div className="flex items-center gap-1"><span className="text-[11px]">http://</span>
                      <input className={inp} value={String(form.website ?? "")} onChange={(e) => set({ website: e.target.value })} /></div>
                  </div>
                  <div className={row}>
                    <span /><span className="grid grid-cols-2 gap-1 text-center text-[11px]"><span>Hubungi :</span><span>Telepon :</span></span>
                    <span /><span className="flex gap-1"><input className={inp} value={String(form.hubungi ?? "")} onChange={(e) => set({ hubungi: e.target.value })} /><input className={inp} value={String(form.hubTelp1 ?? "")} onChange={(e) => set({ hubTelp1: e.target.value })} /></span>
                    <span /><span className="flex gap-1"><input className={inp} value={String(form.hubungi2 ?? "")} onChange={(e) => set({ hubungi2: e.target.value })} /><input className={inp} value={String(form.hubTelp2 ?? "")} onChange={(e) => set({ hubTelp2: e.target.value })} /></span>
                    <span /><span className="flex gap-1"><input className={inp} value={String(form.hubungi3 ?? "")} onChange={(e) => set({ hubungi3: e.target.value })} /><input className={inp} value={String(form.hubTelp3 ?? "")} onChange={(e) => set({ hubTelp3: e.target.value })} /></span>
                    <span className={lbl}>Credit :</span>
                    <span className="flex items-center gap-1">
                      <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.termCrd ?? 0)} onChange={(e) => set({ termCrd: Number(e.target.value) || 0 })} />
                      <span className={lbl}>hari</span>
                      <select className="gf-3d flex-1 bg-white px-1 py-[2px] text-[11px]" value={Number(form.termCrdex ?? 0)} onChange={(e) => set({ termCrdex: Number(e.target.value) })}><option value={0}>+0 EOM</option></select>
                    </span>
                    <span className={lbl}>Glb Disc :</span>
                    <span className="flex items-center gap-1">
                      <input className="gf-3d w-[90px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.spsDisc ?? "0.00")} onChange={(e) => set({ spsDisc: e.target.value })} />
                      <span className={lbl}>%</span><span className="flex-1 text-center text-[10px]">--------------------------&gt;</span>
                      <select className="gf-3d w-[90px] bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
                    </span>
                    <span className={lbl}>Itm Disc :</span>
                    <span className="flex items-center gap-1">
                      <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.discPri2 ?? "0.00")} onChange={(e) => set({ discPri2: e.target.value })} />
                      <span className={lbl}>%</span><span className="flex-1 text-center text-[10px]">--------------------------&gt;</span>
                      <select className="gf-3d w-[90px] bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
                    </span>
                    <span className={lbl}>Max Crd :</span>
                    <span className="flex items-center gap-1">
                      <select className="gf-3d w-[60px] bg-white px-1 py-[2px] text-[11px]"><option>IDR</option></select>
                      <input className="gf-3d w-[110px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.maxCrd ?? 0)} onChange={(e) => set({ maxCrd: Number(e.target.value) || 0 })} />
                      <span className={lbl}>0 Lbr Invoice</span>
                      <select className="gf-3d flex-1 bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
                    </span>
                    <span className={lbl}>Jatuh Tempo :</span>
                    <span className="flex items-center gap-1">
                      <input className="gf-3d w-[60px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.termCrd ?? 0)} readOnly />
                      <span className={lbl}>0 Lbr Invoice</span>
                      <select className="gf-3d flex-1 bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
                    </span>
                    <span className={lbl}>Max :</span>
                    <span className="flex items-center gap-1">
                      <input className="gf-3d w-[60px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.termCrd ?? 0)} readOnly />
                      <span className={lbl}>hari</span>
                      <select className="gf-3d w-[90px] bg-white px-1 py-[2px] text-[11px]"><option>--</option></select>
                      <span className={lbl}>Berdasarkan tanggal jatuh tempo</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-gf-muted">
                    <div className="mb-1 border-b border-gf-border pb-1 font-bold">Catatan tab</div>
                    Tab lain: Inisialisasi (*1/*2), Harga Barang Spesial, Extra Info, Data Personal, Link Perkiraan — konten terpasang pada pass berikut (bukti scan tersimpan).
                  </div>
                </div>
              )}

              {tab === 1 && (
                <div className="grid grid-cols-3 gap-x-3 gap-y-1 border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <span className={lbl}>Kelompok :</span>
                  <span className="col-span-2">
                    <select className={inp} value={Number(form.groupPelId ?? 0)} onChange={(e) => set({ groupPelId: Number(e.target.value) || null })}>
                      <option value={0}>--</option>{grpven.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                    </select>
                  </span>
                  <span className={lbl}>Jenis Penj :</span>
                  <span className="col-span-2">
                    <select className={inp} value={Number(form.jenpenId ?? 0)} onChange={(e) => set({ jenpenId: Number(e.target.value) || null })}>
                      <option value={0}>--</option>{jenpen.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                    </select>
                  </span>
                  <span className={lbl}>No Faktur Pajak :</span>
                  <span className="col-span-2"><input className={inp} value={String(form.fakpjkNo ?? "")} onChange={(e) => set({ fakpjkNo: e.target.value })} /></span>
                  <span className={lbl}>Sales :</span>
                  <span className="col-span-2"><input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.salesId ?? "")} onChange={(e) => set({ salesId: Number(e.target.value) || null })} /></span>
                  <span className={lbl}>Collector :</span>
                  <span className="col-span-2"><input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.collectorId ?? "")} onChange={(e) => set({ collectorId: Number(e.target.value) || null })} /></span>
                  <span className={lbl}>Divisi :</span>
                  <span className="col-span-2">
                    <select className={inp} value={Number(form.divisiId ?? 0)} onChange={(e) => set({ divisiId: Number(e.target.value) || null })}>
                      <option value={0}>--Semua Divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                    </select>
                  </span>
                  <span className={lbl}>Default MU Jual :</span>
                  <span className="col-span-2"><select className="gf-3d w-[90px] bg-white px-1 py-[2px] text-[11px]" value={Number(form.muJual ?? 1)} onChange={(e) => set({ muJual: Number(e.target.value) })}><option value={1}>IDR</option></select></span>
                  <span className={lbl}>Group HJ :</span>
                  <span className="col-span-2"><input className="gf-3d w-[80px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.grphjlId ?? "")} onChange={(e) => set({ grphjlId: Number(e.target.value) || null })} /></span>
                  <span className={lbl}>H. Jual :</span>
                  <span className="col-span-2 flex gap-3">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={Number(form.hargaJual ?? 0) === 0} onChange={() => set({ hargaJual: 0 })} /> Harga Jual</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={Number(form.hargaJual ?? 0) === 1} onChange={() => set({ hargaJual: 1 })} /> HJ Item</label>
                  </span>
                  <span className={lbl}>Adjust Harga :</span>
                  <span className="col-span-2 grid grid-cols-[80px_90px_80px_90px_80px_90px] items-center gap-1">
                    {([["setadj1per", "setadj1nil"], ["setadj2per", "setadj2nil"], ["setadj3per", "setadj3nil"]] as [string, string][]).map(([pk, nk]) => (
                      <span key={pk} className="contents">
                        <input className="gf-3d bg-white px-1 py-[1px] text-right text-[11px]" value={String(form[pk] ?? "")} onChange={(e) => set({ [pk]: e.target.value })} />
                        <input className="gf-3d bg-white px-1 py-[1px] text-right text-[11px]" value={String(form[nk] ?? "")} onChange={(e) => set({ [nk]: e.target.value })} />
                      </span>
                    ))}
                  </span>
                  <span className={lbl}>Pajak :</span>
                  <span className="col-span-2 flex gap-1">
                    <select className="gf-3d w-[70px] bg-white px-1 py-[2px] text-[11px]" value={Number(form.ppnTipe ?? 0)} onChange={(e) => set({ ppnTipe: Number(e.target.value) })}><option value={0}>--</option><option value={1}>PJK</option><option value={2}>NON</option></select>
                    <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.ppnPers ?? "0.00")} onChange={(e) => set({ ppnPers: e.target.value })} />
                    <input className="gf-3d w-[70px] bg-white px-2 py-[2px] text-right text-[12px]" value={String(form.ppnPersex ?? "0.00")} onChange={(e) => set({ ppnPersex: e.target.value })} />
                  </span>
                </div>
              )}

              {tab === 2 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-1 bg-[#c8f0c8] px-2 py-[3px] text-center text-[11px] text-green-800">Tidak dipilih, berarti semuanya boleh.</div>
                  <div className="grid grid-cols-3 gap-1">
                    {["Grouping", "Grouping *2", "Grouping *3"].map((h) => (
                      <div key={h}>
                        <div className="border border-gf-border bg-white px-1 text-[11px]">{h}</div>
                        <div className="h-[280px] overflow-auto border border-gf-border bg-white p-1 text-[11px]">
                          {grpven.slice(0, 120).map((g) => (
                            <label key={g.id} className="flex items-center gap-1 leading-[16px]"><input type="checkbox" /> {g.nama}</label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 3 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-1 border border-gf-border bg-white px-2 py-[3px] text-[11px]">Harga barang spesial per pelanggan (grid menyusul — bukti scan tersimpan).</div>
                  <div className="mb-1 text-[11px] text-gf-muted">Group HJ : <input className="gf-3d ml-1 w-[70px] bg-white px-1 py-[1px] text-right text-[11px]" value={String(form.grphjlId ?? "")} onChange={(e) => set({ grphjlId: Number(e.target.value) || null })} /> · H.Jual: {Number(form.hargaJual ?? 0) === 0 ? "Harga Jual" : "HJ Item"}</div>
                </div>
              )}

              {tab === 4 && (
                <div className="grid grid-cols-2 gap-2 border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div>
                    <div className="mb-1 flex items-center justify-between"><span>Catatan :</span>
                      <button onClick={() => set({ catShow: !form.catShow })} className={`gf-3d px-2 py-[1px] text-[10px] ${form.catShow ? "bg-gf-hl text-white" : "bg-gf-panel"}`}>Catatan ditampilkan setiap pemilihan pelanggan</button>
                    </div>
                    <textarea className="gf-3d h-[120px] w-full bg-white px-2 py-[2px]" value={String(form.catatan ?? "")} onChange={(e) => set({ catatan: e.target.value })} />
                  </div>
                  <div className={row}>
                    <span className={lbl}>Kirim Nama :</span>
                    <input className={inp} value={String(form.krmNama ?? "")} onChange={(e) => set({ krmNama: e.target.value })} />
                    <span className={lbl}>Kirim Alamat :</span>
                    <textarea className="gf-3d h-[80px] bg-white px-2 py-[2px] text-[12px]" value={String(form.krmAlamat ?? "")} onChange={(e) => set({ krmAlamat: e.target.value })} />
                  </div>
                </div>
              )}

              {tab === 5 && (
                <div className="grid grid-cols-3 gap-x-3 gap-y-1 border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <span className={lbl}>Status :</span><span className="col-span-2"><input className={inp} value={String(form.stsPers ?? "")} onChange={(e) => set({ stsPers: e.target.value })} /></span>
                  <span className={lbl}>Agama :</span><span className="col-span-2"><select className="gf-3d w-[120px] bg-white px-1 py-[2px] text-[11px]" value={Number(form.agama ?? 0)} onChange={(e) => set({ agama: Number(e.target.value) })}><option value={0}>--</option><option value={1}>Islam</option><option value={2}>Kristen</option><option value={3}>Katolik</option><option value={4}>Hindu</option><option value={5}>Budha</option></select></span>
                  <span className={lbl}>No. KTP :</span><span className="col-span-2"><input className={inp} value={String(form.noKtp ?? "")} onChange={(e) => set({ noKtp: e.target.value })} /></span>
                  <span className={lbl}>Jenis Kel :</span><span className="col-span-2"><select className="gf-3d w-[120px] bg-white px-1 py-[2px] text-[11px]" value={Number(form.jenisKel ?? 0)} onChange={(e) => set({ jenisKel: Number(e.target.value) })}><option value={0}>--</option><option value={1}>Laki-laki</option><option value={2}>Perempuan</option></select></span>
                  <span className={lbl}>Tmp Lahir :</span><span className="col-span-2"><input className={inp} value={String(form.tmpLahir ?? "")} onChange={(e) => set({ tmpLahir: e.target.value })} /></span>
                  <span className={lbl}>Tgl Lahir :</span><span className="col-span-2"><input type="date" className="gf-3d w-[160px] bg-white px-2 py-[2px] text-[12px]" value={String(form.tglLahir ?? "")} onChange={(e) => set({ tglLahir: e.target.value })} /></span>
                  <span className={lbl}>Pendidikan :</span><span className="col-span-2"><input className={inp} value={String(form.pendAkhir ?? "")} onChange={(e) => set({ pendAkhir: e.target.value })} /></span>
                </div>
              )}

              {tab === 6 && (
                <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
                  <div className="mb-2 border border-gf-border bg-white px-2 py-[3px] text-[11px]">Diisi apabila anda ingin link perkiraan yang berbeda untuk transaksi dengan mata uang tertentu.</div>
                  <div className="flex items-center gap-4">
                    <span>Untuk Transaksi Mata Uang :</span>
                    <select className="gf-3d w-[110px] bg-white px-1 py-[2px] text-[11px]"><option>---</option><option>IDR</option></select>
                    <span>Divisi :</span>
                    <select className="gf-3d w-[170px] bg-white px-1 py-[2px] text-[11px]"><option>--Semua Divisi--</option>{divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}</select>
                  </div>
                  <div className="mt-2 text-[11px] text-gf-muted">(Link perkiraan per mata uang — grid akun menyusul)</div>
                </div>
              )}

              {err && <div className="mt-1 text-[12px] text-red-700">{err}</div>}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={onSimpan} className="gf-3d flex items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
                  <Image src={`${ICON}/simpan.png`} alt="" width={22} height={22} unoptimized /> Simpan
                </button>
                <button onClick={() => setForm(null)} className="gf-3d flex items-center justify-center gap-2 bg-gf-menubar py-[4px] text-[13px]">
                  <Image src={`${ICON}/form-tutup.png`} alt="" width={22} height={22} unoptimized /> Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
