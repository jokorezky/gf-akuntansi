"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@/lib/graphql";

type Row = {
  sysId: number; kasId?: number | null; dbCr?: string | null; no?: string | null; tanggal?: string | null;
  lunasDt?: string | null; lunasDoc?: string | null; mauang?: number | null; nilai?: string | null; nilai3?: string | null;
  kurs?: string | null; perkirId?: number | null; perkirNama?: string | null; lunasCair?: string | null; lunasCairKe?: string | null;
  vendorId?: number | null; vendorNama?: string | null; pelangId?: number | null; pelangNama?: string | null; cairchbg?: boolean | null;
};
type Ref = { id: number; nama?: string | null; alamat?: string | null; daerahId?: number | null; daerahNama?: string | null };

const ROWS = `query($tipe:String!,$dari:String,$sampai:String,$q:String,$status:String,$vendorId:Int,$pelangId:Int,$limit:Int){ chbgList(tipe:$tipe, dari:$dari, sampai:$sampai, q:$q, status:$status, vendorId:$vendorId, pelangId:$pelangId, limit:$limit){ total totalNilai rows { sysId kasId dbCr no tanggal lunasDt lunasDoc mauang nilai nilai3 kurs perkirId perkirNama lunasCair lunasCairKe vendorId vendorNama pelangId pelangNama cairchbg } } }`;
const VREFS = `query{ chbgVendorRef { id nama alamat } }`;
const PREFS = `query{ chbgPelangganRef { id nama alamat daerahId daerahNama } }`;
const CAIRKAN = `mutation($tipe:String!,$ids:[Int!]!,$tgl:String,$catatan:String){ chbgCairkan(tipe:$tipe, ids:$ids, tgl:$tgl, catatan:$catatan) }`;
const BATALCAIR = `mutation($tipe:String!,$ids:[Int!]!){ chbgBatalCair(tipe:$tipe, ids:$ids) }`;

const rp = (n: number): string => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const td = "border border-gf-border px-1 py-[1px]";
const jev = (v: string | null | undefined) => v ?? "";

export function ChbgScreen({ tipe, mode }: { tipe: "masuk" | "keluar"; mode: "cari" | "pencairan" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalNilai, setTotalNilai] = useState("0");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [q, setQ] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [pelangId, setPelangId] = useState<number | null>(null);
  const [vrefs, setVrefs] = useState<Ref[]>([]);
  const [prefs, setPrefs] = useState<Ref[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [tglCair, setTglCair] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const title = tipe === "masuk" ? "CH/BG Kas Masuk/Transfer Kas" : "CH/BG Kas Keluar";

  const load = useCallback(async () => {
    setErr("");
    const d = await gql<{ chbgList: { total: number; totalNilai: string; rows: Row[] } }>(ROWS, {
      tipe, dari: dari || null, sampai: sampai || null, q: q || null,
      status: mode === "pencairan" ? null : null, vendorId: vendorId ?? null, pelangId: pelangId ?? null, limit: 400,
    });
    setRows(d.chbgList.rows); setTotal(d.chbgList.total); setTotalNilai(d.chbgList.totalNilai);
  }, [tipe, dari, sampai, q, vendorId, pelangId, mode]);

  useEffect(() => {
    load().catch((e) => setErr(String(e.message ?? e)));
    if (mode === "cari") {
      gql<{ chbgVendorRef: Ref[] }>(VREFS).then((d) => setVrefs(d.chbgVendorRef)).catch(() => undefined);
      gql<{ chbgPelangganRef: Ref[] }>(PREFS).then((d) => setPrefs(d.chbgPelangganRef)).catch(() => undefined);
    }
  }, [load, mode]);

  const belum = useMemo(() => rows.filter((r) => !r.cairchbg), [rows]);
  const sudah = useMemo(() => rows.filter((r) => r.cairchbg), [rows]);
  const sumBelum = belum.reduce((s, r) => s + Number(r.nilai ?? 0), 0);
  const sumSudah = sudah.reduce((s, r) => s + Number(r.nilai ?? 0), 0);

  function togglePick(id: number, ctrl: boolean) {
    setPicked((p) => (ctrl ? (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]) : [id]));
  }
  async function onCairkan() {
    if (picked.length === 0) return setMsg("Pilih baris dulu di daftar atas.");
    if (!confirm(`Cairkan ${picked.length} baris? (Tgl Cair: ${tglCair})`)) return;
    const n = await gql<{ chbgCairkan: number }>(CAIRKAN, { tipe, ids: picked, tgl: tglCair || null, catatan: catatan || null });
    setPicked([]); setMsg(`${n.chbgCairkan} baris tercairkan.`); await load();
  }
  async function onBatalCair() {
    if (picked.length === 0) return setMsg("Pilih baris dulu di daftar bawah.");
    if (!confirm(`Batalkan pencairan ${picked.length} baris?`)) return;
    const n = await gql<{ chbgBatalCair: number }>(BATALCAIR, { tipe, ids: picked });
    setPicked([]); setMsg(`${n.chbgBatalCair} baris dibatalkan.`); await load();
  }
  const headerCells = (
    <tr className="bg-gf-menubar">
      {["DB/CR", "Note", "Date", ...(mode === "pencairan" ? [] : []), "MU*", "Nilai", "Nilai-3", "Kurs", "Perkiraan", "Tgl Cair", "Cair ke", "Catatan", "Information", "Tgl JT", "Vendor/Pelanggan"].map((h) => (
        <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
      ))}
    </tr>
  );
  function bodyRows(list: Row[], showCatatan: boolean) {
    return list.map((r) => (
      <tr key={r.sysId} onClick={(e) => togglePick(r.sysId, e.ctrlKey || e.metaKey)}
        className={`cursor-pointer ${picked.includes(r.sysId) ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
        <td className={td}>{r.dbCr}</td>
        <td className={td}>{r.no}</td>
        <td className={td}>{r.tanggal}</td>
        <td className={`${td} text-right font-mono`}>IDR</td>
        <td className={`${td} text-right font-mono`}>{rp(Number(r.nilai ?? 0))}</td>
        <td className={`${td} text-right font-mono`}>{rp(Number(r.nilai3 ?? 0))}</td>
        <td className={td}>{r.kurs ?? ""}</td>
        <td className={td}>{r.perkirNama}</td>
        <td className={td}>{r.lunasCair}</td>
        <td className={td}>{r.lunasCairKe}</td>
        {showCatatan ? <td className={td}>{r.lunasCairKe ?? ""}</td> : <td className={td}>{r.lunasDoc ?? ""}</td>}
        <td className={td}>{r.lunasDt}</td>
        <td className={td}>{r.vendorNama || r.pelangNama || ""}</td>
      </tr>
    ));
  }

  return (
    <div className="min-h-screen bg-gf-bg p-2 text-gf-text">
      <div className="mx-auto max-w-[1280px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">{title}</div>
        <div className="p-2">
          {mode === "cari" ? (
            <>
              <div className="mb-2 flex items-center gap-2 text-[12px]">
                <span>Tanggal Jatuh Tempo :</span>
                <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
                <span>-</span>
                <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
                <span className="ml-4">Cari CH/BG :</span>
                <input className="gf-3d w-[330px] bg-white px-2 py-[2px]" value={q} onChange={(e) => setQ(e.target.value)} placeholder="no / keterangan / nama" />
                <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🔍</button>
              </div>
              <div className="mb-2 grid grid-cols-2 gap-2">
                {([["KHUSUS VENDOR", vrefs, vendorId, setVendorId, true], ["KHUSUS PELANGGAN", prefs, pelangId, setPelangId, false]] as const).map(([label, refs, sel, setSel, isV]) => (
                  <div key={label} className="border border-gf-border bg-white">
                    <div className="flex items-center border-b border-gf-border bg-gf-menubar px-1 text-[11px]">
                      <span className="font-bold tracking-wider">{label}</span>
                      {sel != null && (
                        <button onClick={() => setSel(null)} className="gf-3d ml-auto bg-gf-menubar px-1 text-[10px]">× clear</button>
                      )}
                    </div>
                    <div className="h-[110px] overflow-auto">
                      <table className="w-full border-collapse text-[11px]">
                        <thead className="sticky top-0"><tr className="bg-[#efefef]">
                          {(isV ? ["Nama", "Alamat", "ID"] : ["Nama", "Alamat", "Daerah", "DaerahID", "ID"]).map((h) => (
                            <th key={h} className="whitespace-nowrap border border-gf-border px-1 py-[1px] text-left font-normal">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {refs.map((r) => (
                            <tr key={r.id} onDoubleClick={() => { setSel(r.id); setTimeout(() => void load(), 50); }} onClick={() => setSel(r.id)}
                              className={`cursor-pointer ${sel === r.id ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}>
                              <td className={td}>{r.nama}</td>
                              <td className={td}>{r.alamat}</td>
                              {!isV && <td className={td}>{r.daerahNama ?? ""}</td>}
                              {!isV && <td className={td}>{r.daerahId ?? ""}</td>}
                              <td className={td}>{r.id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-1 text-center text-[12px] font-bold tracking-[0.3em] text-gf-accent">P E N C A I R A N&nbsp;&nbsp;C H / B G</div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                <span>Tanggal :</span>
                <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={dari} onChange={(e) => setDari(e.target.value)} />
                <span>-</span>
                <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
                <span className="ml-4">Cari CH/BG :</span>
                <input className="gf-3d w-[300px] bg-white px-2 py-[2px]" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className="gf-3d bg-gf-menubar px-2 py-[2px] text-[11px]">🔍</button>
                <span className="ml-4">Tgl Cair :</span>
                <input type="date" className="gf-3d w-[140px] bg-white px-2 py-[2px]" value={tglCair} onChange={(e) => setTglCair(e.target.value)} />
                <span>Catatan :</span>
                <input className="gf-3d w-[200px] bg-white px-2 py-[2px]" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
              </div>
            </>
          )}
          {err && <div className="mb-2 text-[12px] text-red-700">{err}</div>}
          {msg && !err && <div className="mb-1 text-[11px] text-gf-muted">{msg}</div>}

          {mode === "pencairan" ? (
            <>
              <div className="mb-1 flex items-center gap-1 text-[11px]">
                <b>Belum cair</b><span className="text-gf-muted">({belum.length} baris · {rp(sumBelum)}) — pilih baris (Ctrl+klik multi)</span>
              </div>
              <div className="max-h-[210px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0">{headerCells}</thead>
                  <tbody>
                    {bodyRows(belum, false)}
                    {belum.length === 0 && <tr><td colSpan={13} className="px-2 py-3 text-center text-gf-muted">Tidak ada data belum cair.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="mb-1 mt-3 flex items-center gap-1 text-[11px]">
                <b>Sudah cair</b><span className="text-gf-muted">({sudah.length} baris · {rp(sumSudah)})</span>
              </div>
              <div className="max-h-[180px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0">{headerCells}</thead>
                  <tbody>
                    {bodyRows(sudah, true)}
                    {sudah.length === 0 && <tr><td colSpan={13} className="px-2 py-3 text-center text-gf-muted">Belum ada yang cair.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="max-h-[330px] overflow-auto border border-gf-border bg-white">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0">{headerCells}</thead>
                <tbody>
                  {bodyRows(rows, false)}
                  {rows.length === 0 && <tr><td colSpan={13} className="px-2 py-3 text-center text-gf-muted">Belum ada data (isi filter lalu Proses).</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-1 flex items-center gap-2 text-[11px] text-gf-muted">
            <span>Total: {total} baris</span><span>·</span><span>Nilai: <b className="font-mono">{rp(Number(totalNilai ?? 0))}</b></span>
            {mode === "pencairan" && picked.length > 0 && <span className="text-gf-accent">· terpilih: {picked.length}</span>}
          </div>

          <div className="mt-2 flex items-center gap-1 border-t border-gf-border pt-2">
            {mode === "cari" ? (
              <>
                <button onClick={() => { void load(); }} className="gf-3d bg-gf-menubar px-4 py-[3px] text-[12px] font-bold">Proses</button>
                <button onClick={() => { setDari(""); setSampai(""); setQ(""); setVendorId(null); setPelangId(null); setTimeout(() => void load(), 50); }} className="gf-3d bg-gf-menubar px-4 py-[3px] text-[12px]">Batal</button>
              </>
            ) : (
              <>
                <button onClick={() => setMsg("Cetak Setup — gunakan layar Laporan")} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[12px]">Cetak Setup</button>
                <button onClick={() => setMsg("Cetak — gunakan layar Laporan")} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[12px]">Cetak</button>
                <button onClick={() => { void load(); }} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[12px]">Refresh</button>
                <button onClick={onCairkan} disabled={picked.length === 0} className={`gf-3d px-4 py-[3px] text-[12px] font-bold ${picked.length ? "bg-gf-menubar" : "bg-gf-menubar opacity-40"}`}>Cairkan</button>
                <button onClick={onBatalCair} className="gf-3d bg-gf-menubar px-3 py-[3px] text-[11px] text-gf-muted">Batal Cair</button>
              </>
            )}
            <button onClick={() => { window.location.href = "/"; }} className="gf-3d ml-auto w-[300px] bg-gf-menubar py-[3px] text-[13px]">Tutup</button>
          </div>
          <div className="mt-1 text-[10px] text-gf-muted">Sumber: gf.{(tipe === "masuk" ? "s_kasmex" : "s_kaskex")} — DB/CR dari flag {(tipe === "masuk" ? "kredit" : "debet")}; Tgl Cair/Cair ke = lunas_cair/luncair_nb.</div>
          <div className="text-[10px] text-gf-muted">{jev("")}</div>
        </div>
      </div>
    </div>
  );
}
