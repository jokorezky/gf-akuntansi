"use client";

import type { GfBoxButton, GfMenuBox } from "@/lib/menu-boxes";
import { gfLucide } from "@/lib/gf-lucide";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Kotak menu GF: posisi absolut (%) dari observasi GF dipertahankan; skin modern + ikon lucide. */
export function MenuBox({
  box,
  onItem,
  onHome,
  root,
  company,
}: {
  box: GfMenuBox;
  onItem: (b: GfBoxButton) => void;
  onHome: () => void;
  root?: boolean;
  company?: string;
}) {
  return (
    <div className="px-2 pb-2 pt-1">
      {root ? (
        <div className="mb-2 text-center text-[12.5px] font-semibold tracking-wide text-gf-accent">
          {company ?? ""}
        </div>
      ) : (
        <>
          <div className="mb-1.5 text-center text-[12px] font-semibold text-slate-500">
            {box.title.replace(/^Menu /, "")}
          </div>
          <Button variant="default" size="sm" className="mb-2 w-full" onClick={onHome}>
            Menu Utama (<span className="underline">ESC</span>)
          </Button>
        </>
      )}
      <div
        className="relative rounded-lg border border-slate-200 bg-slate-100/70"
        style={{ width: 268, height: Math.round(268 * box.ratio) }}
      >
        {box.items.map((it, i) => {
          const Icon = gfLucide(it.label);
          return it.small ? (
            <button
              key={i}
              type="button"
              title={it.blocked ? "Dinonaktifkan (destruktif/berat)" : it.label}
              onClick={() => onItem(it)}
              className={cn(
                "absolute flex items-center justify-center rounded-md border border-gf-border bg-white px-1 text-center text-[10.5px] font-medium leading-[12px] transition-all",
                it.blocked
                  ? "text-slate-300"
                  : "text-slate-600 hover:border-gf-accent/30 hover:text-gf-accent hover:shadow-sm",
              )}
              style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, height: `${it.h}%` }}
            >
              {it.label}
            </button>
          ) : (
            <button
              key={i}
              type="button"
              title={it.blocked ? "Dinonaktifkan (destruktif/berat)" : it.label}
              onClick={() => onItem(it)}
              className={cn(
                "absolute flex flex-col items-center justify-center gap-1 rounded-xl border border-gf-border bg-white pb-1 pt-2 transition-all",
                it.blocked
                  ? "opacity-60"
                  : "hover:-translate-y-[1px] hover:border-gf-accent/30 hover:shadow-md",
              )}
              style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, height: `${it.h}%` }}
            >
              <Icon className="h-[30px] w-[30px] text-gf-accent" strokeWidth={1.7} />
              <span className="block w-full px-[2px] text-center text-[10.5px] font-medium leading-[12px] text-slate-600">
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
