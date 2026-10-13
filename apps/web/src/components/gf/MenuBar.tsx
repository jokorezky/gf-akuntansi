"use client";

import { useState } from "react";
import { GF_MENU, type GfMenuItem } from "@/lib/gf-menu";
import { cn } from "@/lib/utils";

export function MenuBar({
  onSelect,
}: {
  onSelect: (group: string, item: GfMenuItem) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);

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
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    disabled={it.blocked}
                    onClick={() => {
                      onSelect(g.label, it);
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
    </div>
  );
}
