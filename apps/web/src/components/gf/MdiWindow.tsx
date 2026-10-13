import type { ReactNode } from "react";

/** Window card GF — v6.1: tanpa tombol window (— ▢ ✕); penutupan via tombol "Tutup" di toolbar layar. */
export function MdiWindow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="gf-window">
      <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[5px]">
        <span className="text-[12.5px] font-semibold text-slate-800">{title}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
