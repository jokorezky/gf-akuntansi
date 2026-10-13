"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Globe } from "lucide-react";
import { toast } from "sonner";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/gf/Pager";

type Row = {
  id: number;
  no?: string | null;
  tanggal?: string | null;
  pelangganNama?: string | null;
  totHarga?: string | null;
  totDisc?: string | null;
  ppnNilai?: string | null;
  catatan?: string | null;
};

const F = `id no tanggal pelangganNama totHarga totDisc ppnNilai catatan`;
const LIST = `query($q:String, $limit:Int, $offset:Int){ saleList(q:$q, limit:$limit, offset:$offset){ total rows { ${F} } } }`;

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export default function ExportPenjualanWebPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setPage(1);
  }, [q]);

  const load = useCallback(async () => {
    const d = await gql<{ saleList: { total: number; rows: Row[] } }>(LIST, {
      q,
      limit: 10,
      offset: (page - 1) * 10,
    });
    setRows(d.saleList.rows);
    setTotal(d.saleList.total);
  }, [q, page]);

  useEffect(() => {
    load().catch((e) => setErr(String((e as Error).message ?? e)));
  }, [load]);

  function unduh(namaFile: string, isi: string, mime: string) {
    const blob = new Blob([isi], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = namaFile;
    a.click();
  }

  async function exportWeb() {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ saleList: { total: number; rows: Row[] } }>(LIST, {
        q,
        limit: 5000,
        offset: 0,
      });
      const payload = {
        exportedAt: new Date().toISOString(),
        source: "GF-Akuntansi Clone",
        count: d.saleList.rows.length,
        rows: d.saleList.rows.map((r) => ({
          no: r.no,
          tanggal: r.tanggal,
          pelanggan: r.pelangganNama ?? "",
          total: num(r.totHarga) - num(r.totDisc) + num(r.ppnNilai),
          catatan: r.catatan ?? "",
        })),
      };
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      unduh(`export-penjualan-web-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
      toast.success(`Export Web selesai — ${payload.count} data (JSON).`);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      toast.error("Export Web gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ saleList: { rows: Row[] } }>(LIST, { q, limit: 5000, offset: 0 });
      const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
      const lines = [
        ["NO", "TANGGAL", "PELANGGAN", "TOTAL"].map(esc).join(";"),
        ...d.saleList.rows.map((r) =>
          [r.no ?? "", r.tanggal ?? "", r.pelangganNama ?? "", (num(r.totHarga) - num(r.totDisc) + num(r.ppnNilai)).toFixed(2)]
            .map(esc)
            .join(";"),
        ),
      ];
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      unduh(`export-penjualan-${stamp}.csv`, lines.join("\r\n"), "text/csv;charset=utf-8");
      toast.success(`Export CSV selesai — ${d.saleList.rows.length} data.`);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      toast.error("Export CSV gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[1100px]">
        <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[6px]">
          <span className="text-[12.5px] font-semibold text-slate-800">Export Penjualan ke Web</span>
        </div>
        <div className="p-3">
          <div className="mb-2 text-center text-[12px] font-semibold tracking-[0.35em] text-gf-accent">
            EXPORT PENJUALAN KE WEB
          </div>
          <div className="mb-3 flex items-center gap-2">
            <input
              className="h-[30px] w-full max-w-[420px] rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15"
              placeholder="" title="Pencarian (ketik untuk mencari)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="mx-auto" />
            <Button variant="primary" onClick={exportWeb} disabled={busy}>
              <Globe className="h-[14px] w-[14px]" />
              Export ke Web (JSON)
            </Button>
            <Button variant="default" onClick={exportCsv} disabled={busy}>
              <FileSpreadsheet className="h-[14px] w-[14px] text-emerald-600" />
              Export CSV
            </Button>
            <Button variant="default" title="Ekspor data halaman aktif">
              <FileJson className="h-[14px] w-[14px] text-sky-600" />
              <Download className="h-[13px] w-[13px]" />
            </Button>
          </div>
          <div className="mb-2 text-[11px] text-slate-400">
            Format JSON: {`{ exportedAt, source, count, rows: [{ no, tanggal, pelanggan, total, catatan }] }`} — siap dikonsumsi web/API.
          </div>
          {err && <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">{err}</div>}
          <div className="max-h-[460px] overflow-auto rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {["NO", "TANGGAL", "PELANGGAN", "TOTAL"].map((h) => (
                    <th key={h} className="border-b border-gf-border px-3 py-[7px] text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-[6px] font-mono text-slate-600">{r.no}</td>
                    <td className="px-3 py-[6px] text-slate-600">{r.tanggal}</td>
                    <td className="px-3 py-[6px] font-medium text-slate-700">{r.pelangganNama}</td>
                    <td className="px-3 py-[6px] text-right font-mono text-slate-700">
                      {(num(r.totHarga) - num(r.totDisc) + num(r.ppnNilai)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-2 py-6 text-center text-slate-400">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} onPage={setPage} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
