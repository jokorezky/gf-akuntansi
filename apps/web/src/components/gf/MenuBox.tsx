"use client";

import Image from "next/image";
import type { GfBoxButton, GfMenuBox } from "@/lib/menu-boxes";

/** Kotak menu GF 1:1: posisi absolut (%) dari hasil observasi + ikon asli hasil crop. */
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
        <div className="mb-1 text-center text-[12px] text-[#1e3fae]">{company ?? ""}</div>
      ) : (
        <>
          <div className="mb-1 flex items-center justify-center gap-2">
            <span className="text-[12px] text-gf-text">{box.title.replace(/^Menu /, "")}</span>
          </div>
          <button
            type="button"
            onClick={onHome}
            className="gf-3d mb-2 w-full bg-gf-panel py-[4px] text-[12px] hover:bg-gf-hl hover:text-white"
          >
            Menu Utama (<span className="underline">ESC</span>)
          </button>
        </>
      )}
      <div className="relative bg-[#e4e4e4]" style={{ width: 268, height: Math.round(268 * box.ratio) }}>
        {box.items.map((it, i) =>
          it.small ? (
            <button
              key={i}
              type="button"
              title={it.blocked ? "Dinonaktifkan (destruktif/berat)" : it.label}
              onClick={() => onItem(it)}
              className={`gf-3d absolute flex items-center justify-center bg-gf-menubar px-1 text-center text-[11px] leading-[12px] ${
                it.blocked ? "text-gf-muted/70" : "hover:bg-gf-hl hover:text-white"
              }`}
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
              className={`gf-3d absolute flex flex-col items-center justify-start bg-gf-panel pb-[1px] pt-[2px] ${
                it.blocked ? "opacity-70" : "hover:bg-gf-hl hover:text-white"
              }`}
              style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, height: `${it.h}%` }}
            >
              <span className="relative block h-[72%] w-full">
                <Image src={it.icon} alt={it.label} fill sizes="120px" className="object-contain" unoptimized />
              </span>
              <span className="mt-[1px] block w-full px-[2px] text-center text-[10px] leading-[11px]">{it.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
