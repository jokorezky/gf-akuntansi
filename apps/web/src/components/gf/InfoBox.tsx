"use client";

import { useState } from "react";

export type InfoRow = {
  label: string;
  value: string;
  col2Label?: string;
  col2Value?: string;
};

function stamp(d: Date) {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Kartu info desktop GF — posisi persis (overlay kanan-bawah), skin modern. */
export function InfoBox({ rows }: { rows: InfoRow[] }) {
  const [login] = useState(() => stamp(new Date()));

  return (
    <div className="flex w-[478px] items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/70 px-3 py-2 shadow-[0_4px_18px_rgba(16,122,52,0.10)]">
      <span
        className="h-[40px] w-[40px] shrink-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, #ffd9c9 0%, #e05545 22%, #8f2d68 48%, #2c3e8f 76%, #141c4d 100%)",
          boxShadow: "inset -5px -7px 10px rgba(0,0,0,0.22), inset 4px 5px 9px rgba(255,255,255,0.5)",
        }}
      />
      <div className="relative flex-1 leading-[16px]">
        <span className="absolute right-0 top-0 rounded bg-emerald-100/80 px-1.5 py-[1px] text-[10px] font-medium text-emerald-700">
          {login}
        </span>
        {rows.map((r) => (
          <div key={r.label} className="flex gap-2">
            <span className="w-[74px] shrink-0 whitespace-nowrap text-right text-[10.5px] text-slate-400">{r.label}</span>
            <span className="flex-1 font-medium text-slate-700">{r.value}</span>
            {r.col2Label && (
              <>
                <span className="w-[70px] shrink-0 whitespace-nowrap text-right text-[10.5px] text-slate-400">{r.col2Label}</span>
                <span className="w-[86px] shrink-0 font-medium text-slate-700">{r.col2Value ?? ""}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
