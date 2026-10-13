"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pager standar (15 baris/halaman): Prev/Next + nomor halaman + info rentang. */
export function Pager({
  page,
  total,
  perPage = 15,
  onPage,
  className,
}: {
  page: number;
  total: number;
  perPage?: number;
  onPage: (p: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  const nums: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i < start + 5 && i <= pages; i++) nums.push(i);

  const btn =
    "flex h-[24px] min-w-[24px] items-center justify-center rounded-md border border-gf-border bg-white px-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-gf-accent/40 hover:text-gf-accent disabled:opacity-40 disabled:hover:border-gf-border disabled:hover:text-slate-600";

  return (
    <div className={cn("flex items-center justify-between gap-3 text-[11px] text-slate-400", className)}>
      <span>
        Menampilkan <span className="font-medium text-slate-600">{from}</span>–
        <span className="font-medium text-slate-600">{to}</span> dari{" "}
        <span className="font-medium text-slate-600">{total}</span>
      </span>
      <span className="flex items-center gap-1">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} title="Sebelumnya">
          <ChevronLeft className="h-[13px] w-[13px]" />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            className={cn(btn, n === page && "border-gf-accent bg-gf-accent text-white hover:text-white")}
          >
            {n}
          </button>
        ))}
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} title="Berikutnya">
          <ChevronRight className="h-[13px] w-[13px]" />
        </button>
      </span>
    </div>
  );
}
