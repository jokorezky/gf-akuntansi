"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuBar } from "./MenuBar";
import { InfoBox } from "./InfoBox";
import { StatusBar } from "./StatusBar";
import { DashboardMenu } from "./DashboardMenu";
import { GF_MENU, type GfMenuItem } from "@/lib/gf-menu";
import { GF_MENU_BOXES, type GfBoxButton } from "@/lib/menu-boxes";
import { ROUTES } from "@/lib/routes";



export function Shell() {
  const router = useRouter();
  const [view, setView] = useState<string>("home"); // "home" | group label
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const b = new URLSearchParams(window.location.search).get("box");
    if (b && GF_MENU_BOXES.some((x) => x.group === b)) {
      setView(b);
      setMessage(`Menu ${b}`);
    }
  }, []);

  /** Klik kartu dashboard (root = buka grup; submenu = buka layar/aksi). */
  function onItem(b: GfBoxButton) {
    const grp = GF_MENU.find((g) => g.label === b.label);
    if (view === "home" && grp) {
      setView(grp.label);
      setMessage(`Menu ${grp.label}`);
      return;
    }
    if (b.label === "Bantuan") {
      setMessage("Bantuan — F1 untuk daftar tombol (Key List)");
      return;
    }
    if (b.label === "Log Off" || b.label === "Exit") {
      setMessage(`${b.label} — dinonaktifkan di clone`);
      return;
    }
    if (b.id && ROUTES[b.id]) {
      router.push(ROUTES[b.id]);
      return;
    }
    setMessage(
      `${view} › ${b.label}${b.blocked ? " (dinonaktifkan — destruktif/berat)" : " — belum diimplementasikan"}`,
    );
  }

  function onSelect(menuGroup: string, item: GfMenuItem) {
    if (ROUTES[item.id]) {
      router.push(ROUTES[item.id]);
      return;
    }
    setMessage(
      `${menuGroup} › ${item.label}${item.blocked ? " (dinonaktifkan)" : " — belum diimplementasikan"}`,
    );
  }

  const infoRows = [
    { label: "Nama", value: "MONI COSMETIC SUPERMARKET" },
    { label: "User Login", value: "Acu [U.1 G.Owner]" },
    { label: "System Date", value: new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { label: "Proteksi", value: "11/10/2026", col2Label: "Tutup Hari", col2Value: "30/06/2026" },
    { label: "Eceran", value: "TGL_KOMP", col2Label: "Tutup Buku", col2Value: "31/12/2025" },
  ];

  return (
    <div className="flex h-screen flex-col bg-gf-bg">
      <MenuBar onSelect={onSelect} />

      <div className="relative flex-1 overflow-auto bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-5 md:px-8">
        <DashboardMenu
          view={view}
          company="MONI COSMETIC SUPERMARKET"
          onItem={onItem}
          onHome={() => {
            setView("home");
            setMessage("");
          }}
        />

        {/* Kartu info desktop GF — overlay kanan-bawah */}
        <div className="absolute bottom-3 right-3 z-10">
          <InfoBox rows={infoRows} />
        </div>
      </div>

      <StatusBar message={message} />
    </div>
  );
}
