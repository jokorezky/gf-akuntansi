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
    <div className="flex items-center justify-between border-t border-gf-border bg-white px-2 py-[3px] text-[11px] text-slate-500">
      <span className="truncate pl-1">{message ?? ""}</span>
      <span className="flex items-center gap-[6px]">
        <span className="rounded-md border border-gf-border bg-slate-50 px-2 py-[1px] text-right font-medium text-slate-600">
          {now.date}
        </span>
        <span className="rounded-md border border-gf-border bg-slate-50 px-2 py-[1px] text-right font-medium text-slate-600">
          {now.time}
        </span>
      </span>
    </div>
  );
}
