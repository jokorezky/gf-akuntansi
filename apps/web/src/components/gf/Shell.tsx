"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { MdiWindow } from "./MdiWindow";
import { InfoBox } from "./InfoBox";
import { StatusBar } from "./StatusBar";
import { MenuBox } from "./MenuBox";
import { GF_MENU, type GfMenuItem } from "@/lib/gf-menu";
import { GF_MENU_BOXES, type GfBoxButton } from "@/lib/menu-boxes";

/** Menu id GF → rute web (layar yang sudah diimplementasikan). */
const ROUTES: Record<number, string> = {
  24553: "/master/karyawan",
  24554: "/master/vendor",
  24556: "/master/pelanggan",
  24558: "/master/item",
  24559: "/master/sisa-stock",
  24566: "/pembelian",
  24562: "/purchase-order",
  24567: "/retur-pembelian",
  24572: "/deposit-pembelian",
  24573: "/pembayaran-hutang",
  24575: "/daftar-hutang",
  24600: "/penjualan",
  24598: "/penjualan-eceran",
  24593: "/sales-order",
  24602: "/retur-penjualan",
  24610: "/penerimaan-piutang",
  24612: "/daftar-piutang",
  24620: "/kas-masuk",
  24621: "/kas-keluar",
  24622: "/transfer-kas",
  24624: "/cari-chbg-masuk",
  24625: "/cari-chbg-keluar",
  24627: "/pencairan-chbg-masuk",
  24628: "/pencairan-chbg-keluar",
  24632: "/pembelian-antar-cabang",
  24633: "/penjualan-antar-cabang",
  24637: "/jurnal",
  24642: "/buku-besar",
  24644: "/laporan-keuangan",
  24635: "/aktiva-tetap",
  24658: "/barang-masuk",
  24659: "/barang-keluar",
  24646: "/promosi",
  24647: "/barang-promosi",
  24650: "/barang-transfer",
  24651: "/barang-untransfer",
  24652: "/barang-pindah-gudang",
  24661: "/kartu-stock",
  24662: "/kartu-hutang",
  24663: "/kartu-piutang",
  24656: "/barang-expired",
  24654: "/barang-produksi",
  24639: "/gl/cek-kurs-jurnal",
  24640: "/gl/cek-perantara",
  24641: "/gl/saldo-akhir",
  24668: "/laporan",
};

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

  /** Klik item di kotak menu GF (layout 1:1). */
  function onBoxItem(b: GfBoxButton) {
    // Menu Utama: item = grup
    const grp = GF_MENU.find((g) => g.label === b.label);
    if ((view === "home" || view === "Menu Utama") && grp) {
      setView(grp.label);
      setMessage(`Menu ${grp.label}`);
      return;
    }
    if (b.label === "Bantuan") {
      setMessage("Bantuan — belum diimplementasikan (Fase V2)");
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
      `${view} › ${b.label}${b.blocked ? " (dinonaktifkan — destruktif/berat)" : " — belum diimplementasikan (Fase V2)"}`,
    );
  }

  function onSelect(menuGroup: string, item: GfMenuItem) {
    if (ROUTES[item.id]) {
      router.push(ROUTES[item.id]);
      return;
    }
    setMessage(
      `${menuGroup} › ${item.label}${item.blocked ? " (dinonaktifkan)" : " — belum diimplementasikan (P1)"}`,
    );
  }

  const infoRows = [
    { label: "Nama", value: "MONI COSMETIC SUPERMARKET" },
    { label: "User Login", value: "Acu [U.1 G.Owner]" },
    { label: "System Date", value: new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { label: "Proteksi", value: "12/10/2026" },
    { label: "Tutup Hari", value: "30/06/2026" },
    { label: "Tutup Buku", value: "31/12/2025" },
  ];

  const currentBox =
    view === "home"
      ? GF_MENU_BOXES.find((b) => b.group === "Menu Utama")
      : GF_MENU_BOXES.find((b) => b.group === view);

  return (
    <div className="flex h-screen flex-col bg-gf-bg">
      <MenuBar onSelect={onSelect} />
      <Toolbar />

      <div className="relative flex-1 overflow-auto p-2">
        {/* background splash ala GF */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <span className="text-[64px] font-bold tracking-tight text-gf-accent">GF-AKUNTANSI</span>
        </div>

        <div className="relative w-[360px]">
          <MdiWindow
            title={currentBox?.title ?? "Menu Utama"}
            onClose={() => {
              setView("home");
              setMessage("");
            }}
          >
            {currentBox && (
              <>
                <MenuBox
                  box={currentBox}
                  onItem={onBoxItem}
                  onHome={() => {
                    setView("home");
                    setMessage("");
                  }}
                />
                {view === "home" && (
                  <div className="mb-2 px-3">
                    <InfoBox rows={infoRows} />
                  </div>
                )}
              </>
            )}
          </MdiWindow>
        </div>
      </div>

      <StatusBar message={message} />
    </div>
  );
}
