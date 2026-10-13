"use client";

import { useCallback, useEffect, useState } from "react";
import { gql } from "@/lib/graphql";

type Profil = {
  sysId: number; versi?: number | null; nama?: string | null; alamat?: string | null; negara?: number | null;
  npwp?: string | null; npwpNama?: string | null; pkpNo?: string | null; fakpjkNo?: string | null;
  telepon?: string | null; fax?: string | null; email?: string | null; website?: string | null;
  rekening1?: string | null; rekening2?: string | null; rekening3?: string | null; rekening4?: string | null; rekening5?: string | null;
  qris?: string | null; menuHotel?: boolean | null; menuKtv?: boolean | null; menuBill?: boolean | null;
};
type Ringkas = {
  profil?: Profil | null;
  divisi: { id: number; divisi?: string | null }[];
  kontNo: { sysId: number; untuk?: number | null; divisiId?: number | null; tahun?: number | null; last01?: number | null; last02?: number | null; last03?: number | null }[];
  pcFlags: { sysId: number; hotel?: string | null; ktv?: string | null; billiard?: string | null; rental?: string | null; spa?: string | null }[];
  ownrCount: number;
  kolomKontro: number;
  koncabCount: number;
};

const RINGKAS = `query{ konfigurasiRingkas{ profil{ sysId versi nama alamat negara npwp npwpNama pkpNo fakpjkNo telepon fax email website rekening1 rekening2 rekening3 rekening4 rekening5 qris menuHotel menuKtv menuBill } divisi{ id divisi } kontNo{ sysId untuk divisiId tahun last01 last02 last03 } pcFlags{ sysId hotel ktv billiard rental spa } ownrCount kolomKontro koncabCount } }`;
const SIMPAN = `mutation($input:KonfigurasiProfilInput!){ simpanKonfigurasiProfil(input:$input){ sysId nama alamat website email telepon } }`;

const jev = (v: string | null | undefined) => v ?? "";
const TABS = ["Profil Perusahaan", "Divisi & Gudang", "No. Dokumen", "Map Harga Jual (Modul)", "Info Paket"];

export default function KonfigurasiPage({ defaultTab = 0 }: { defaultTab?: number }) {
  const [data, setData] = useState<Ringkas | null>(null);
  const [form, setForm] = useState<Profil | null>(null);
  const [tab, setTab] = useState(defaultTab);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await gql<{ konfigurasiRingkas: Ringkas }>(RINGKAS);
    setData(d.konfigurasiRingkas);
    setForm(d.konfigurasiRingkas.profil ?? null);
  }, []);

  useEffect(() => { load().catch((e) => setErr(String(e.message ?? e))); }, [load]);

  const set = (patch: Partial<Profil>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function onSimpan() {
    if (!form) return;
    setErr(""); setMsg("");
    try {
      const input = {
        nama: form.nama || null, alamat: form.alamat || null, negara: form.negara ?? null,
        npwp: form.npwp || null, npwpNama: form.npwpNama || null, pkpNo: form.pkpNo || null, fakpjkNo: form.fakpjkNo || null,
        telepon: form.telepon || null, fax: form.fax || null, email: form.email || null, website: form.website || null,
        rekening1: form.rekening1 || null, rekening2: form.rekening2 || null, rekening3: form.rekening3 || null,
        rekening4: form.rekening4 || null, rekening5: form.rekening5 || null, qris: form.qris || null,
        menuHotel: form.menuHotel ?? false, menuKtv: form.menuKtv ?? false, menuBill: form.menuBill ?? false,
      };
      await gql(SIMPAN, { input });
      setMsg("Konfigurasi tersimpan."); await load();
    } catch (e) { setErr(String((e as Error).message ?? e)); }
  }

  const td = "border border-gf-border px-1 py-[1px]";

  return (
    <div className="min-h-full bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1150px] border border-gf-border bg-gf-panel">
        <div className="flex items-center gap-1 border-b border-gf-border bg-gf-titlebar px-2 py-1">
          <span className="text-[13px] font-bold">Sistem Konfigurasi</span>
          <span className="ml-auto text-[10px] text-gf-muted">s_kontro: {data?.kolomKontro ?? "…"} kolom · s_koncab: {data?.koncabCount ?? 0} baris{data && data.koncabCount === 0 ? " (belum diisi)" : ""}</span>
        </div>
        <div className="p-2">
          <div className="mb-2 flex gap-1">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className={`gf-3d px-3 py-[3px] text-[12px] ${tab === i ? "bg-white font-bold" : "bg-gf-menubar"}`}>{t}</button>
            ))}
            <button onClick={() => setMsg("PAKET ACCOUNTING 1 USER — info lisensi (lihat tab Info Paket)")} className="gf-3d ml-auto bg-gf-menubar px-3 py-[3px] text-[10px]">PAKET ACCOUNTING 1 USER</button>
          </div>
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}

          {tab === 0 && form && (
            <div className="grid grid-cols-[110px_1fr_110px_1fr] items-start gap-x-2 gap-y-1 text-[12px]">
              <span>ID :</span><input className="gf-3d w-[90px] bg-[#c8f0c8] px-2 py-[2px]" readOnly value={form.sysId} />
              <span className="text-right">Versi :</span><input className="gf-3d w-[90px] bg-white px-2 py-[2px]" readOnly value={form.versi ?? ""} />
              <span>Nama :</span><input className="gf-3d col-span-3 bg-white px-2 py-[2px]" value={jev(form.nama)} onChange={(e) => set({ nama: e.target.value })} />
              <span>Alamat :</span>
              <textarea className="gf-3d col-span-3 h-[64px] bg-white px-2 py-[2px]" value={jev(form.alamat)} onChange={(e) => set({ alamat: e.target.value })} />
              <span>Negara :</span><input className="gf-3d w-[70px] bg-white px-2 py-[2px]" value={form.negara ?? ""} onChange={(e) => set({ negara: e.target.value ? Number(e.target.value) : null })} />
              <span className="text-right">NPWP :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.npwp)} onChange={(e) => set({ npwp: e.target.value })} />
              <span>Nama NPWP :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.npwpNama)} onChange={(e) => set({ npwpNama: e.target.value })} />
              <span className="text-right">PKP No :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.pkpNo)} onChange={(e) => set({ pkpNo: e.target.value })} />
              <span>Fak Pjk No :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.fakpjkNo)} onChange={(e) => set({ fakpjkNo: e.target.value })} />
              <span className="text-right">Telepon :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.telepon)} onChange={(e) => set({ telepon: e.target.value })} />
              <span>Fax :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.fax)} onChange={(e) => set({ fax: e.target.value })} />
              <span className="text-right">Email :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.email)} onChange={(e) => set({ email: e.target.value })} />
              <span>Website :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.website)} onChange={(e) => set({ website: e.target.value })} />
              <span className="text-right">QRIS :</span><input className="gf-3d bg-white px-2 py-[2px]" value={jev(form.qris)} onChange={(e) => set({ qris: e.target.value })} />
              {([["rekening1", "Rekening 1"], ["rekening2", "Rekening 2"], ["rekening3", "Rekening 3"], ["rekening4", "Rekening 4"], ["rekening5", "Rekening 5"]] as const).map(([k, label]) => (
                <span key={k} className="contents">
                  <span>{label} :</span><input className="gf-3d col-span-3 bg-white px-2 py-[2px]" value={jev(form[k] as string | null)} onChange={(e) => set({ [k]: e.target.value } as Partial<Profil>)} />
                </span>
              ))}
              <span>Menu :</span>
              <div className="col-span-3 flex gap-3">
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.menuHotel ?? false} onChange={(e) => set({ menuHotel: e.target.checked })} /> Hotel</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.menuKtv ?? false} onChange={(e) => set({ menuKtv: e.target.checked })} /> KTV</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={form.menuBill ?? false} onChange={(e) => set({ menuBill: e.target.checked })} /> Billiard</label>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="border border-gf-border bg-white" style={{ maxHeight: 420, overflow: "auto" }}>
              <table className="w-full border-collapse text-[11px]">
                <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["No", "Gudang", "Divisi"].map((h) => <th key={h} className="border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {(data?.divisi ?? []).map((d, i) => (
                    <tr key={d.id}><td className={td}>{i + 1}</td><td className={td}>GUDANG {String(d.divisi ?? "").toUpperCase()} ({d.id})</td><td className={td}>{d.divisi}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 2 && (
            <div className="border border-gf-border bg-white" style={{ maxHeight: 420, overflow: "auto" }}>
              <table className="w-full border-collapse text-[11px]">
                <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["ID", "Untuk", "Divisi", "Tahun", "Last 01", "Last 02", "Last 03"].map((h) => <th key={h} className="border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {(data?.kontNo ?? []).map((r) => (
                    <tr key={r.sysId}><td className={td}>{r.sysId}</td><td className={td}>{r.untuk}</td><td className={td}>{r.divisiId}</td><td className={td}>{r.tahun}</td><td className={td}>{r.last01}</td><td className={td}>{r.last02}</td><td className={td}>{r.last03}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 3 && (
            <div className="border border-gf-border bg-white" style={{ maxHeight: 420, overflow: "auto" }}>
              <table className="w-full border-collapse text-[11px]">
                <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{["ID", "Hotel", "KTV", "Billiard", "Rental", "Spa"].map((h) => <th key={h} className="border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {(data?.pcFlags ?? []).map((r) => (
                    <tr key={r.sysId}><td className={td}>{r.sysId}</td><td className={td}>{r.hotel ?? ""}</td><td className={td}>{r.ktv ?? ""}</td><td className={td}>{r.billiard ?? ""}</td><td className={td}>{r.rental ?? ""}</td><td className={td}>{r.spa ?? ""}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 4 && (
            <div className="border border-gf-border bg-[#f4f4f4] p-3 text-[12px]">
              <div className="mb-1 font-bold">PAKET ACCOUNTING 1 USER</div>
              <div>Versi : {data?.profil?.versi ?? "-"} · Profil tersimpan di gf.s_kontro ({(data?.kolomKontro ?? 0).toLocaleString("id-ID")} kolom).</div>
              <div>Owner ID (s_ownrid): {data?.ownrCount ?? 0} baris · Konfigurasi cabang (s_koncab): {data?.koncabCount ?? 0} baris.</div>
              <div className="mt-2 text-gf-muted">Catatan: layar konfigurasi GF memiliki puluhan tab (gudang/divisi, jurnal khusus, bulanan 1141 kolom). Kloning saat ini menampilkan inti (profil, divisi, penomoran, fasilitas PC) & menyimpan subset profil — sisanya pass lanjutan (dicatat).</div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
            {tab === 0 && <button onClick={onSimpan} className="gf-3d w-[500px] bg-gf-menubar py-[3px] text-[13px]">Simpan</button>}
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d w-[500px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
