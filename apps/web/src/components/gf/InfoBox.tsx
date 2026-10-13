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

/** Kartu info desktop GF (overlay kanan-bawah): border hijau, bola 3D, 2 kolom + stempel waktu login. */
export function InfoBox({ rows }: { rows: InfoRow[] }) {
  const [login] = useState(() => stamp(new Date()));

  return (
    <div
      className="flex w-[450px] items-center gap-2 rounded-[3px] border-2 border-[#7db300] px-2 py-1 text-[11px]"
      style={{ background: "linear-gradient(180deg, #fdfbe8, #eef7d8)" }}
    >
      <span
        className="h-[42px] w-[42px] shrink-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, #ffd9c9 0%, #e05545 22%, #8f2d68 48%, #2c3e8f 76%, #141c4d 100%)",
          boxShadow: "inset -6px -8px 12px rgba(0,0,0,0.25), inset 4px 6px 10px rgba(255,255,255,0.5)",
        }}
      />
      <div className="relative flex-1 leading-[15px]">
        <span className="absolute right-0 top-0 text-[10px] text-[#2f8f1f]">{login}</span>
        {rows.map((r) => (
          <div key={r.label} className="flex gap-2">
            <span className="w-[62px] shrink-0 text-right text-[#5a6b3a]">{r.label}</span>
            <span className="flex-1 text-[#336600]">{r.value}</span>
            {r.col2Label && (
              <>
                <span className="w-[62px] shrink-0 text-right text-[#5a6b3a]">{r.col2Label}</span>
                <span className="w-[78px] shrink-0 text-[#336600]">{r.col2Value ?? ""}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
