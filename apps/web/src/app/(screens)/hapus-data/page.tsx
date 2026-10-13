"use client";

import { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/gf/ConfirmHost";

type Row = { tabel: string; keterangan: string; nilai: string };

export default function Page() {
  const [sampai, setSampai] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [konf, setKonf] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function preview() {
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ hapusPreview: Row[] }>(
        "query($s:String!){ hapusPreview(sampai:$s){ tabel keterangan nilai } }",
        { s: sampai },
      );
      setRows(d.hapusPreview);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function eksekusi() {
    if (konf !== "HAPUS") return toast.error("Ketik HAPUS untuk konfirmasi.");
    const ok = await confirmDialog(
      `HAPUS SEMUA DATA TRANSAKSI s/d ${sampai}? Aksi ini permanen dan tidak bisa dibatalkan.`,
      { title: "Hapus Data s/d Tanggal", okText: "Ya, HAPUS permanen" },
    );
    if (!ok) return;
    setBusy(true);
    setErr("");
    try {
      const d = await gql<{ hapusData: string }>(
        "mutation($s:String!, $k:String!){ hapusData(sampai:$s, konfirmasi:$k) }",
        { s: sampai, k: konf },
      );
      toast.success(d.hapusData);
      await preview();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      toast.error("Gagal menghapus data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[860px]">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">
          Hapus Data s/d Tanggal
        </div>
        <div className="p-4">
          <div className="mb-3 text-center text-[12px] font-semibold tracking-[0.3em] text-gf-accent">
            HAPUS DATA S/D TANGGAL
          </div>
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            <TriangleAlert className="h-[20px] w-[20px] shrink-0" />
            <p>
              Aksi destruktif: menghapus data <b>transaksi</b> (penjualan, pembelian, retur, jurnal, kas) s/d tanggal terpilih.
              Data master tidak dihapus. Lakukan Preview dulu sebelum eksekusi.
            </p>
          </div>
          {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">{err}</div>}
          <div className="mb-3 flex items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">Sampai Tanggal</div>
              <input type="date" className="h-[30px] rounded-md border border-gf-border bg-white px-3 text-[12px]" value={sampai} onChange={(e) => setSampai(e.target.value)} />
            </div>
            <Button variant="default" onClick={preview} disabled={busy || !sampai}>
              Preview Jumlah
            </Button>
            <div>
              <div className="mb-1 text-[11px] text-slate-400">Ketik HAPUS utk konfirmasi</div>
              <input className="h-[30px] w-[160px] rounded-md border border-gf-border bg-white px-3 text-[12px] font-mono" value={konf} onChange={(e) => setKonf(e.target.value)} placeholder="HAPUS" />
            </div>
            <Button variant="danger" onClick={eksekusi} disabled={busy || konf !== "HAPUS" || !sampai}>
              <Trash2 className="h-[14px] w-[14px]" />
              Hapus Data
            </Button>
          </div>
          <div className="rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="border-b border-gf-border px-3 py-[7px] text-left font-medium">Tabel</th>
                  <th className="border-b border-gf-border px-3 py-[7px] text-left font-medium">Sumber</th>
                  <th className="border-b border-gf-border px-3 py-[7px] text-right font-medium">Baris (≤ tanggal)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.keterangan} className="border-b border-slate-100">
                    <td className="px-3 py-[6px] font-medium text-slate-700">{r.tabel}</td>
                    <td className="px-3 py-[6px] font-mono text-[11px] text-slate-400">{r.keterangan}</td>
                    <td className="px-3 py-[6px] text-right font-mono text-slate-700">{r.nilai}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Tekan Preview Jumlah.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
