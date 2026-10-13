import type { ReactNode } from "react";
import { Minus, Square, X } from "lucide-react";

export function MdiWindow({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="gf-window">
      <div className="flex items-center justify-between border-b border-gf-border bg-white px-3 py-[5px]">
        <span className="text-[12.5px] font-semibold text-slate-800">{title}</span>
        <span className="flex items-center gap-[4px]">
          <button
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
            title="Minimize"
          >
            <Minus className="h-[13px] w-[13px]" />
          </button>
          <button
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
            title="Maximize"
          >
            <Square className="h-[11px] w-[11px]" />
          </button>
          <button
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Tutup"
            onClick={onClose}
          >
            <X className="h-[14px] w-[14px]" />
          </button>
        </span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
