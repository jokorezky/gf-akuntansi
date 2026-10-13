"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql";

type CatalogItem = { kode: string; nama: string; file: string; kategori: string; implemented?: boolean | null };
type CatalogGroup = { label: string; items: CatalogItem[] };
type Hasil = { kode: string; judul: string; kolom: string[]; baris: string[][]; total: number; catatan?: string | null };

const CATALOG = `query { laporanCatalog { total groups { label items { kode nama file kategori implemented } } } }`;
const HASIL = `query($kode:String!,$q:String,$limit:Int){ laporanHasil(kode:$kode,q:$q,limit:$limit){ judul kolom baris total catatan } }`;

type Periode = "tanggal" | "bulan" | "tahun" | "custom";

export default function LaporanPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<CatalogGroup[]>([]);
  const [gIdx, setGIdx] = useState(0);
  const [kode, setKode] = useState<string>("");
  const [q, setQ] = useState("");
  const [periode, setPeriode] = useState<Periode>("tanggal");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState<CatalogItem | null>(null);
  const [setup, setSetup] = useState(false);
  const [lastProses, setLastProses] = useState<string>("");

  const prosesFor = useCallback(async (k: string, qq: string) => {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ laporanHasil: Hasil }>(HASIL, { kode: k, q: qq, limit: 500 });
      setHasil(d.laporanHasil);
      setLastProses(new Date().toLocaleString("id-ID"));
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    gql<{ laporanCatalog: { groups: CatalogGroup[] } }>(CATALOG)
      .then((d) => {
        const gs = d.laporanCatalog.groups;
        setGroups(gs);
        const k = new URLSearchParams(window.location.search).get("kode");
        if (k) {
          const gi = gs.findIndex((g) => g.items.some((it) => it.kode === k));
          if (gi >= 0) {
            setGIdx(gi);
            setKode(k);
            void prosesFor(k, "");
          }
        }
      })
      .catch((e) => setErr(String(e.message ?? e)));
  }, [prosesFor]);

  const items = useMemo(() => groups[gIdx]?.items ?? [], [groups, gIdx]);
  const selected = useMemo(() => items.find((x) => x.kode === kode) ?? null, [items, kode]);

  const proses = useCallback(async () => {
    if (!kode) return;
    await prosesFor(kode, q);
  }, [kode, q, prosesFor]);

  const exportCsv = useCallback(() => {
    if (!hasil) return;
    const esc = (v: string) => `"${String(v).replaceAll('"', '""')}"`;
    const csv = [hasil.kolom.map(esc).join(";"), ...hasil.baris.map((r) => r.map(esc).join(";"))].join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${hasil.judul.replace(/[^\w-]+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [hasil]);

  return (
    <div className="min-h-screen bg-gf-bg p-3 text-gf-text">
      <div className="mx-auto max-w-[1250px] border border-gf-border bg-gf-panel">
        <div className="border-b border-gf-border bg-gf-titlebar px-2 py-1 text-[13px] font-bold">Reports / Laporan</div>
        <div className="p-2">
          <div className="mb-2 text-center text-[12px] font-bold tracking-widest text-gf-accent">
            {hasil?.judul ?? selected?.nama ?? "L A P O R A N"}
          </div>
          <div className="grid grid-cols-[380px_1fr] gap-2">
            <div>
              <div className="mb-1 text-[12px] font-bold">PILIH KELOMPOK LAPORAN</div>
              <div className="border border-gf-border bg-white">
                {groups.map((g, i) => (
                  <button
                    key={g.label}
                    onClick={() => { setGIdx(i); setKode(""); setHasil(null); }}
                    className={`block w-full px-2 py-[3px] text-left text-[12px] ${i === gIdx ? "bg-[#316ac5] text-white" : "hover:bg-[#e8eef7]"}`}
                  >
                    {i + 1}. {g.label} <span className={i === gIdx ? "text-white/80" : "text-gf-muted"}>({g.items.filter((x) => x.implemented).length}/{g.items.length})</span>
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[11px] text-gf-muted">Pilih dengan mouse klik / tombol 1-9.</div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-bold">NAMA-NAMA LAPORAN</span>
                <button
                  onClick={() => selected && setInfo(selected)}
                  className="gf-3d bg-gf-menubar px-3 py-[2px] text-[12px]"
                >
                  Info
                </button>
              </div>
              <div className="max-h-[300px] overflow-auto border border-gf-border bg-white">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-gf-menubar">
                      <th className="border border-gf-border px-2 py-1 text-left font-normal">Nama Laporan</th>
                      <th className="border border-gf-border px-2 py-1 text-left font-normal">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr
                        key={it.kode}
                        onClick={() => { setKode(it.kode); setHasil(null); }}
                        className={`cursor-pointer ${kode === it.kode ? "bg-[#e8eef7]" : "hover:bg-[#f3f6fb]"}`}
                      >
                        <td className="border border-gf-border px-2 py-[2px]"><span title={it.implemented ? "terimplementasi" : "belum"} className={`mr-1 inline-block h-[8px] w-[8px] rounded-full ${it.implemented ? "bg-green-600" : "bg-[#d9a400]"}`} />{it.nama}</td>
                        <td className="border border-gf-border px-2 py-[2px] text-gf-muted">{it.file}</td>
                      </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan={2} className="px-2 py-3 text-center text-gf-muted">Belum ada data.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_auto] items-end gap-2 border-t border-gf-border pt-2">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-[11px] text-gf-muted">Periode Laporan</div>
                <div className="flex gap-2 text-[12px]">
                  {([["tanggal", "Tanggal"], ["bulan", "Bulan"], ["tahun", "Tahun"], ["custom", "Custom"]] as [Periode, string][]).map(([v, l]) => (
                    <label key={v} className="flex items-center gap-1">
                      <input type="radio" checked={periode === v} onChange={() => setPeriode(v)} />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
              <input
                className="gf-3d w-[260px] bg-white px-2 py-[3px] text-[12px]"
                placeholder="Filter teks (nama/kode)..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && proses()}
              />
              <div className="text-[11px] text-gf-muted">Terakhir Proses : {lastProses || "-"}</div>
            </div>
            <button
              onClick={proses}
              disabled={!kode || busy}
              className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px] disabled:opacity-50"
            >
              {busy ? "Proses..." : "Proses"}
            </button>
          </div>

          {err && <div className="mt-2 text-[12px] text-red-700">{err}</div>}

          {hasil && (
            <div className="mt-2">
              <div className="overflow-auto border border-gf-border bg-white max-h-[420px]">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0">
                    <tr className="bg-gf-menubar">
                      {hasil.kolom.map((h) => (
                        <th key={h} className="border border-gf-border px-2 py-1 text-left font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.baris.map((r, i) => (
                      <tr key={i} className="hover:bg-[#e8eef7]">
                        {r.map((c, j) => (
                          <td key={j} className="border border-gf-border px-2 py-[2px]">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-gf-muted">
                <span>Total: {hasil.total} baris (tampil maks. 500){hasil.catatan ? ` — ${hasil.catatan}` : ""}</span>
              </div>
            </div>
          )}

          <div className="mt-2 flex gap-2 border-t border-gf-border pt-2">
            <button onClick={exportCsv} disabled={!hasil} className="gf-3d flex-1 bg-gf-menubar px-2 py-[3px] text-[12px] disabled:opacity-50">
              &amp;Export &gt;&gt;&gt; Text File
            </button>
            <button onClick={() => { if (!hasil) return; const txt = [hasil.kolom.join(" | "), ...hasil.baris.map((r) => r.join(" | "))].join("\r\n"); const blob = new Blob([txt], { type: "text/plain;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${hasil.judul.replace(/[^\w-]+/g, "_")}.txt`; a.click(); }} disabled={!hasil} className="gf-3d bg-gf-menubar px-4 py-[3px] text-[12px] disabled:opacity-50">Unduh TXT</button>
            <button onClick={() => setSetup(true)} className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px]">Setup</button>
            <button onClick={() => window.print()} disabled={!hasil} className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px] disabled:opacity-50">&amp;Cetak</button>
            <button onClick={() => router.push("/")} className="gf-3d bg-gf-menubar px-6 py-[3px] text-[12px]">&amp;Tutup</button>
          </div>
        </div>
      </div>

      {info && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30" onClick={() => setInfo(null)}>
          <div className="w-[420px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 border-b border-gf-border pb-1 text-[13px] font-bold">Info Laporan</div>
            <div className="text-[12px]">
              <div>Nama : {info.nama}</div>
              <div>File : {info.file}</div>
              <div>Kategori : {info.kategori}</div>
              <div className="mt-1 text-gf-muted">Sumber GF: D:\GF Akuntansi\ST_Rep2\</div>
            </div>
            <div className="mt-3 text-right">
              <button onClick={() => setInfo(null)} className="gf-3d bg-gf-menubar px-4 py-[2px] text-[12px]">&amp;Tutup</button>
            </div>
          </div>
        </div>
      )}

      {setup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30" onClick={() => setSetup(false)}>
          <div className="w-[320px] border border-gf-border bg-gf-panel p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 border-b border-gf-border pb-1 text-[13px] font-bold">Report Set</div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-[110px]">Number Copies :</span>
              <input className="gf-3d w-[80px] bg-white px-2 py-[2px]" defaultValue="1" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="w-[110px]">Print To :</span>
              <select className="gf-3d flex-1 bg-white px-1 py-[2px]">
                <option>Default Printer</option>
                <option>Microsoft Print to PDF</option>
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setSetup(false)} className="gf-3d flex-1 bg-gf-menubar px-[2px] py-[2px] text-[12px]">&amp;Ok</button>
              <button onClick={() => setSetup(false)} className="gf-3d flex-1 bg-gf-menubar px-[2px] py-[2px] text-[12px]">&amp;Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
