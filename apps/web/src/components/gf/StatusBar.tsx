"use client";

import { useEffect, useState } from "react";

function fmt(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}  ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

export function StatusBar({ message }: { message?: string }) {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const t = setInterval(() => setNow(fmt(new Date())), 1000);
    setNow(fmt(new Date()));
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center justify-between border-t border-gf-border bg-gf-menubar px-1 py-[2px] text-[11px]">
      <span className="truncate text-gf-text pl-1">{message ?? ""}</span>
      <span className="gf-3d min-w-[160px] bg-gf-panel px-2 text-right text-gf-text">{now}</span>
    </div>
  );
}
