"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, CalendarDays, Coins, Flag, Landmark, ListTree, MapPin, Package2, Percent, Ruler, Store, Tag, Users } from "lucide-react";
import { gql } from "@/lib/graphql";
import { GfTabs } from "@/components/gf/GfTabs";
import { Pager } from "@/components/gf/Pager";

type Lookup = { kode: string; judul: string; kolom: string[]; baris: string[][] };

const TABS = [
  { kode: "mauang", label: "Mata Uang", icon: Coins },
  { kode: "kurs", label: "Kurs", icon: Banknote },
  { kode: "grphjl", label: "Pembulatan Harga Jual", icon: Percent },
  { kode: "negara", label: "Negara", icon: Flag },
  { kode: "daerah", label: "Daerah", icon: MapPin },
  { kode: "daera2", label: "Daerah *2", icon: MapPin },
  { kode: "divisi", label: "Divisi", icon: Landmark },
  { kode: "grpven", label: "Group Vendor", icon: Store },
  { kode: "grpstk", label: "Group Stock", icon: Package2 },
  { kode: "grpst2", label: "Group Stock *2", icon: Package2 },
  { kode: "grpst3", label: "Group Stock *3", icon: Package2 },
  { kode: "jenpen", label: "Jenis Penjualan", icon: Tag },
  { kode: "jenpem", label: "Jenis Pembelian", icon: Ruler },
] as const;

export default function SetupListPage() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<Lookup | null>(null);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setData(null);
    try {
      const d = await gql<{ lookupList: Lookup }>(
        "query($k:String!){ lookupList(kode:$k){ kode judul kolom baris } }",
        { k: TABS[tab].kode },
      );
      setData(d.lookupList);
      setPage(1);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.baris ?? [];
  const pageRows = rows.slice((page - 1) * 10, page * 10);

  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[1250px]">
        <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[6px]">
          <span className="text-[12.5px] font-semibold text-slate-800">List (Mata Uang, Kurs, Negara, Daerah, dsbnya)</span>
        </div>
        <div className="p-3">
          <div className="mb-2 text-center text-[12px] font-semibold tracking-[0.35em] text-gf-accent">
            LIST (SISTEM SETUP)
          </div>
          <div className="mb-2 flex flex-wrap gap-1 border-b border-gf-border">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.kode}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`-mb-[1px] flex items-center gap-1.5 border-b-2 px-2.5 py-[6px] text-[11.5px] font-medium transition-colors ${
                    tab === i ? "border-gf-accent text-gf-accent" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-[14px] w-[14px]" />
                  {t.label}
                </button>
              );
            })}
          </div>
          {err && <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">{err}</div>}
          <div className="max-h-[520px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {(data?.kolom ?? ["Memuat…"]).map((h) => (
                    <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, ri) => (
                  <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50">
                    {r.map((c, ci) => (
                      <td key={ci} className={`px-3 py-[6px] ${ci === 0 ? "font-mono text-slate-500" : "text-slate-700"}`}>{c}</td>
                    ))}
                  </tr>
                ))}
                {!data && <tr><td className="px-3 py-6 text-center text-slate-400">Memuat…</td></tr>}
                {data && rows.length === 0 && (
                  <tr><td colSpan={data.kolom.length} className="px-3 py-6 text-center text-slate-400">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={rows.length} onPage={setPage} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
