"use client";

import { useEffect, useState } from "react";

function parts(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
  };
}

export function StatusBar({ message }: { message?: string }) {
  const [now, setNow] = useState<{ date: string; time: string }>({ date: "", time: "" });

  useEffect(() => {
    const t = setInterval(() => setNow(parts(new Date())), 1000);
    setNow(parts(new Date()));
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center justify-between border-t border-gf-border bg-gf-menubar px-1 py-[2px] text-[11px]">
      <span className="truncate pl-1 text-gf-text">{message ?? ""}</span>
      <span className="flex items-center gap-1">
        <span className="gf-3d min-w-[86px] bg-gf-panel px-2 text-right text-gf-text">{now.date}</span>
        <span className="gf-3d min-w-[72px] bg-gf-panel px-2 text-right text-gf-text">{now.time}</span>
      </span>
    </div>
  );
}
