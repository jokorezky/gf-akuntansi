"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DatabaseZap, Info, X } from "lucide-react";
import { GF_MENU, type GfMenuItem } from "@/lib/gf-menu";
import { isRemoved } from "@/lib/removed-menus";
import { gql } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DbRow = { tabel: string; keterangan: string; nilai: string };

export function MenuBar({
  onSelect,
}: {
  onSelect: (group: string, item: GfMenuItem) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [dlg, setDlg] = useState<null | "about" | "dbinfo">(null);
  const [dbRows, setDbRows] = useState<DbRow[]>([]);
  const [dbBusy, setDbBusy] = useState(false);

  /** Item Help yang berupa dialog (About 24676 / DB Info 24675). */
  function handleLocal(it: GfMenuItem): boolean {
    if (it.id === 24676) {
      setDlg("about");
      return true;
    }
    if (it.id === 24675) {
      setDlg("dbinfo");
      setDbBusy(true);
      gql<{ dbInfo: DbRow[] }>("{ dbInfo { tabel keterangan nilai } }")
        .then((d) => setDbRows(d.dbInfo))
        .catch(() => setDbRows([]))
        .finally(() => setDbBusy(false));
      return true;
    }
    return false;
  }

  return (
    <div className="relative select-none">
      <div className="flex items-stretch gap-[2px] border-b border-gf-border bg-gf-menubar px-2 py-[3px]">
        {GF_MENU.map((g, i) => (
          <div key={g.label} className="relative">
            <button
              type="button"
              className={cn(
                "rounded-md px-2.5 py-[3px] text-[12px] font-medium transition-colors",
                open === i
                  ? "bg-gf-accent text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-gf-accent",
              )}
              onClick={() => setOpen(open === i ? null : i)}
              onMouseEnter={() => open !== null && setOpen(i)}
            >
              {g.label}
            </button>
            {open === i && (
              <div className="absolute left-0 top-full z-30 mt-1 min-w-[250px] rounded-lg border border-gf-border bg-white py-1.5 shadow-[0_10px_38px_rgba(15,23,42,0.15)]">
                {g.items.filter((it) => !isRemoved(it.id)).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    disabled={it.blocked}
                    onClick={() => {
                      if (!handleLocal(it)) onSelect(g.label, it);
                      setOpen(null);
                    }}
                    className={cn(
                      "mx-1 flex w-[calc(100%-8px)] items-center justify-between gap-6 rounded-md px-2.5 py-[5px] text-left text-[12px] transition-colors",
                      it.blocked
                        ? "cursor-not-allowed text-slate-300"
                        : "text-slate-700 hover:bg-gf-accent/5 hover:text-gf-accent",
                    )}
                    title={it.blocked ? "Dinonaktifkan (aksi destruktif/berat)" : it.label}
                  >
                    <span>{it.label}</span>
                    {it.hotkey && (
                      <span className="rounded border border-slate-200 bg-slate-50 px-1 py-[1px] text-[10px] text-slate-400">
                        {it.hotkey}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {open !== null && <div className="fixed inset-0 z-20" onClick={() => setOpen(null)} />}

      {/* Dialog About GF-Akuntansi (24676) */}
      <Dialog.Root open={dlg === "about"} onOpenChange={(v) => !v && setDlg(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-900/35 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gf-border bg-white p-5 shadow-2xl outline-none">
            <div className="flex items-center gap-3">
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gf-accent/10 text-gf-accent">
                <Info className="h-[20px] w-[20px]" />
              </span>
              <div>
                <Dialog.Title className="text-[14px] font-semibold text-slate-800">About GF-Akuntansi</Dialog.Title>
                <p className="text-[11px] text-slate-400">GFsoft Indonesia</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 rounded-lg border border-gf-border bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-600">
              <p><span className="inline-block w-[110px] text-slate-400">Aplikasi</span> GF-Akuntansi</p>
              <p><span className="inline-block w-[110px] text-slate-400">Release</span> 951.1823</p>
              <p><span className="inline-block w-[110px] text-slate-400">Build</span> 2026.06.28</p>
              <p><span className="inline-block w-[110px] text-slate-400">Clone Web</span> GF-Akuntansi Clone (TypeScript)</p>
            </div>
            <Button variant="primary" size="lg" className="mt-4 w-full" onClick={() => setDlg(null)}>
              OK
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog DB Info (24675) */}
      <Dialog.Root open={dlg === "dbinfo"} onOpenChange={(v) => !v && setDlg(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-900/35 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] flex max-h-[80vh] w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-gf-border bg-white p-4 shadow-2xl outline-none">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-800">
                <DatabaseZap className="h-[18px] w-[18px] text-gf-accent" />
                DB Info
              </span>
              <button
                className="flex h-[24px] w-[24px] items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => setDlg(null)}
              >
                <X className="h-[14px] w-[14px]" />
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-auto rounded-lg border border-gf-border">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="border-b border-gf-border px-3 py-[7px] text-left font-medium">Tabel</th>
                    <th className="border-b border-gf-border px-3 py-[7px] text-left font-medium">Sumber</th>
                    <th className="border-b border-gf-border px-3 py-[7px] text-right font-medium">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {dbBusy && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-400">Memuat…</td></tr>
                  )}
                  {!dbBusy && dbRows.length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-400">Tidak ada data.</td></tr>
                  )}
                  {!dbBusy && dbRows.map((r) => (
                    <tr key={r.keterangan} className="border-b border-slate-100">
                      <td className="px-3 py-[6px] font-medium text-slate-700">{r.tabel}</td>
                      <td className="px-3 py-[6px] font-mono text-[11px] text-slate-400">{r.keterangan}</td>
                      <td className="px-3 py-[6px] text-right font-mono text-slate-700">{r.nilai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
