"use client";

import { useRouter } from "next/navigation";
import { MenuBar } from "@/components/gf/MenuBar";
import { StatusBar } from "@/components/gf/StatusBar";
import { ROUTES } from "@/lib/routes";
import type { GfMenuItem } from "@/lib/gf-menu";

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function onSelect(_group: string, item: GfMenuItem) {
    const r = ROUTES[item.id];
    if (r) router.push(r);
  }

  return (
    <div className="flex h-screen flex-col bg-gf-bg">
      <MenuBar onSelect={onSelect} />
      <div className="relative flex-1 overflow-auto bg-gradient-to-b from-slate-50 to-slate-100">{children}</div>
      <StatusBar />
    </div>
  );
}
