import type { ReactNode } from "react";

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
    <div className="border border-gf-border bg-gf-panel shadow-sm">
      <div className="flex items-center justify-between bg-gf-titlebar px-1">
        <span className="py-[2px] text-[13px] font-bold text-black">{title}</span>
        <span className="flex items-center gap-1">
          <button className="gf-3d h-[16px] w-[18px] bg-gf-panel text-[10px] leading-none" title="Minimize">
            _
          </button>
          <button className="gf-3d h-[16px] w-[18px] bg-gf-panel text-[10px] leading-none" title="Maximize">
            ▢
          </button>
          <button
            className="gf-3d h-[16px] w-[18px] bg-gf-panel text-[10px] leading-none"
            title="Tutup"
            onClick={onClose}
          >
            ✕
          </button>
        </span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
