"use client";

import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { GF_MENU } from "@/lib/gf-menu";
import { GF_MENU_BOXES, type GfBoxButton } from "@/lib/menu-boxes";
import { gfLucide } from "@/lib/gf-lucide";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPECIAL = new Set(["Bantuan", "Log Off", "Exit"]);

/** Dashboard premium full (v6): Menu Utama 6 kolom + submenu full, perilaku GF dipertahankan. */
export function DashboardMenu({
  view,
  company,
  onItem,
  onHome,
}: {
  view: string;
  company: string;
  onItem: (b: GfBoxButton) => void;
  onHome: () => void;
}) {
  const root = view === "home";
  const box = root
    ? GF_MENU_BOXES.find((b) => b.group === "Menu Utama")
    : GF_MENU_BOXES.find((b) => b.group === view);

  useEffect(() => {
    if (root) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onHome();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [root, onHome]);

  const allMenuItems = GF_MENU.flatMap((g) => g.items);
  const hotkeyFor = (id?: number) => allMenuItems.find((i) => i.id === id)?.hotkey;
  const countFor = (label: string) => GF_MENU.find((g) => g.label === label)?.items.length;

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {!root && (
            <Button variant="ghost" size="sm" className="-ml-1 mb-2 text-slate-500 hover:text-gf-accent" onClick={onHome}>
              <ChevronLeft className="h-[15px] w-[15px]" />
              Menu Utama (<span className="underline">ESC</span>)
            </Button>
          )}
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-800">
            {root ? company : (box?.title.replace(/^Menu /, "") ?? "")}
          </h1>
          <p className="mt-[2px] text-[12px] text-slate-400">
            {root ? "Pilih menu untuk mulai bekerja" : `${box?.items.length ?? 0} menu tersedia`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {box?.items.map((it, i) => {
          const Icon = gfLucide(it.label);
          const special = root && SPECIAL.has(it.label);
          const hk = !root ? hotkeyFor(it.id) : undefined;
          const cnt = root ? countFor(it.label) : undefined;
          return (
            <button
              key={`${it.label}-${i}`}
              type="button"
              title={it.blocked ? "Dinonaktifkan (destruktif/berat)" : it.label}
              onClick={() => onItem(it)}
              className={cn(
                "group relative flex h-[136px] flex-col items-center justify-center gap-2.5 rounded-2xl border bg-white px-3 text-center transition-all duration-150",
                it.blocked
                  ? "border-slate-200 opacity-75"
                  : special
                    ? "border-slate-200 hover:-translate-y-[2px] hover:border-slate-300 hover:shadow-md"
                    : "border-slate-200 shadow-sm hover:-translate-y-[2px] hover:border-gf-accent/40 hover:shadow-[0_12px_30px_rgba(122,27,32,0.12)]",
              )}
            >
              <span
                className={cn(
                  "flex h-[54px] w-[54px] items-center justify-center rounded-xl transition-colors",
                  special
                    ? "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    : it.blocked
                      ? "bg-slate-100 text-slate-400"
                      : "bg-gf-accent/[0.08] text-gf-accent group-hover:bg-gf-accent/[0.14]",
                )}
              >
                <Icon className="h-[28px] w-[28px]" strokeWidth={1.7} />
              </span>
              <span className="text-[12.5px] font-semibold leading-tight text-slate-800">{it.label}</span>
              {cnt != null && <span className="text-[10.5px] text-slate-400">{cnt} menu</span>}
              {cnt == null && hk && (
                <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-[1px] text-[10px] font-medium text-slate-400">
                  {hk}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
