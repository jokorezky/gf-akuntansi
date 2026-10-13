"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tab modern (underline) — posisi/nama/urutan tab tetap sesuai layar GF. */
export function GfTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { label: string; icon?: LucideIcon }[];
  value: number;
  onChange: (i: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 border-b border-gf-border", className)} role="tablist">
      {tabs.map((t, i) => {
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={value === i}
            onClick={() => onChange(i)}
            className={cn(
              "-mb-[1px] flex items-center gap-1.5 border-b-2 px-3 py-[6px] text-[12px] font-medium transition-colors",
              value === i
                ? "border-gf-accent text-gf-accent"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {Icon && <Icon className="h-[15px] w-[15px]" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
