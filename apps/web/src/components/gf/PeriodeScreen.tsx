"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/gf/ConfirmHost";

type KhRow = { tabel: string; keterangan: string; nilai: string };

/** Layar periode akuntansi: Set Proteksi Data / Tutup Hari (+Reset) / Tutup Tahun Pembukuan. */
export function PeriodeScreen({
  jenis,
  judul,
  deskripsi,
  bolehReset,
}: {
  jenis: "proteksi" | "tutup_hari" | "tutup_buku";
  judul: string;
  deskripsi: string;
  bolehReset?: boolean;
}) {
  const [rows, setRows] = useState<KhRow[]>([]);
  const [tgl, setTgl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await gql<{ khInfo: KhRow[] }>("{ khInfo { tabel keterangan nilai } }");
      setRows(d.khInfo);
      const cur = d.khInfo.find((r) => r.keterangan.includes(jenis === "proteksi" ? "tgl_kunci" : jenis));
      setTgl(cur && cur.nilai !== "-" ? cur.nilai.slice(0, 10) : "");
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    }
  }, [jenis]);

  useEffect(() => {
    load();
  }, [load]);

  async function simpan() {
    if (!tgl) return toast.error("Tanggal wajib diisi.");
    setBusy(true);
    try {
      const d = await gql<{ khSave: string }>(
        "mutation($j:String!, $t:String!){ khSave(jenis:$j, tanggal:$t) }",
        { j: jenis, t: tgl },
      );
      toast.success(`Tersimpan: ${d.khSave}`);
      await load();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      toast.error("Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function resetTgl() {
    const ok = await confirmDialog(`Kosongkan ${judul}?`, { title: "Reset Periode" });
    if (!ok) return;
    setBusy(true);
    try {
      await gql<{ khSave: string }>("mutation($j:String!, $t:String!){ khSave(jenis:$j, tanggal:$t) }", {
        j: jenis,
        t: "",
      });
      toast.success("Direset (dikosongkan).");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const cur = rows.find((r) => r.keterangan.includes(jenis === "proteksi" ? "tgl_kunci" : jenis));

  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[760px]">
        <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[6px]">
          <span className="text-[12.5px] font-semibold text-slate-800">{judul}</span>
        </div>
        <div className="p-4">
          <div className="mb-3 text-center text-[12px] font-semibold tracking-[0.3em] text-gf-accent">
            {judul.toUpperCase()}
          </div>
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-gf-border bg-slate-50 px-4 py-3">
            <span className="flex h-[40px] w-[40px] items-center justify-center rounded-xl bg-gf-accent/10 text-gf-accent">
              {jenis === "proteksi" ? <ShieldCheck className="h-[20px] w-[20px]" /> : <CalendarCheck className="h-[20px] w-[20px]" />}
            </span>
            <div className="text-[12px] leading-relaxed text-slate-600">
              <p>{deskripsi}</p>
              <p className="text-slate-400">
                Nilai saat ini: <span className="font-mono text-slate-600">{cur?.nilai ?? "-"}</span>
              </p>
            </div>
          </div>
          {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">{err}</div>}
          <div className="flex items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">Tanggal</div>
              <input
                type="date"
                className="h-[30px] rounded-md border border-gf-border bg-white px-3 text-[12px] shadow-inner outline-none focus:border-gf-accent/50 focus:ring-2 focus:ring-gf-accent/15"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
              />
            </div>
            <Button variant="primary" size="lg" onClick={simpan} disabled={busy}>
              <Save className="h-[15px] w-[15px]" />
              Simpan
            </Button>
            {bolehReset && (
              <Button variant="default" size="lg" onClick={resetTgl} disabled={busy}>
                <RotateCcw className="h-[15px] w-[15px] text-amber-600" />
                Reset (Kosongkan)
              </Button>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-gf-border bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="border-b border-gf-border px-3 py-[7px] text-left font-medium">Periode</th>
                  <th className="border-b border-gf-border px-3 py-[7px] text-left font-medium">Kolom</th>
                  <th className="border-b border-gf-border px-3 py-[7px] text-right font-medium">Nilai</th>
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
