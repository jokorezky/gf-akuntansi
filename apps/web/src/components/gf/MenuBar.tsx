"use client";

import { useState } from "react";
import { GF_MENU, type GfMenuItem } from "@/lib/gf-menu";

export function MenuBar({
  onSelect,
}: {
  onSelect: (group: string, item: GfMenuItem) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="relative select-none">
      <div className="flex items-stretch bg-gf-menubar border-b border-gf-border">
        {GF_MENU.map((g, i) => (
          <div key={g.label} className="relative">
            <button
              type="button"
              className={`px-2 py-[3px] text-[12px] ${
                open === i ? "bg-gf-hl text-white" : "text-gf-text hover:bg-gf-hl hover:text-white"
              }`}
              onClick={() => setOpen(open === i ? null : i)}
              onMouseEnter={() => open !== null && setOpen(i)}
            >
              {g.label}
            </button>
            {open === i && (
              <div className="absolute left-0 top-full z-30 min-w-[230px] bg-gf-panel border border-gf-border py-1 shadow">
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    disabled={it.blocked}
                    onClick={() => {
                      onSelect(g.label, it);
                      setOpen(null);
                    }}
                    className={`flex w-full items-center justify-between gap-6 px-3 py-[3px] text-left text-[12px] ${
                      it.blocked
                        ? "text-gf-muted/60 cursor-not-allowed"
                        : "text-gf-text hover:bg-gf-hl hover:text-white"
                    }`}
                    title={it.blocked ? "Dinonaktifkan (aksi destruktif/berat)" : it.label}
                  >
                    <span>{it.label}</span>
                    {it.hotkey && <span className="text-[11px] opacity-70">{it.hotkey}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(null)} />
      )}
    </div>
  );
}
