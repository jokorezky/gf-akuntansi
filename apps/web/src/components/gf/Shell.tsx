"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { MdiWindow } from "./MdiWindow";
import { InfoBox } from "./InfoBox";
import { StatusBar } from "./StatusBar";
import { GF_MENU, GF_HOME_TILES, type GfMenuItem } from "@/lib/gf-menu";

const COMPANY = "NAMA PERUSAHAAN";

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
  24637: "/jurnal",
  24642: "/buku-besar",
  24644: "/laporan-keuangan",
  24635: "/aktiva-tetap",
  24658: "/barang-masuk",
  24659: "/barang-keluar",
  24646: "/promosi",
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

  const group = GF_MENU.find((g) => g.label === view) ?? null;

  function onTile(tag: string) {
    const g = GF_MENU.find((x) => x.label === tag);
    if (g) {
      setView(tag);
      setMessage(`Menu ${tag}`);
    } else {
      setMessage(`${tag} — belum diimplementasikan (P1 kerangka)`);
    }
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
    { label: "Nama", value: COMPANY },
    { label: "User Login", value: "—" },
    { label: "System Date", value: new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { label: "Proteksi", value: "—" },
    { label: "Tutup Hari", value: "—" },
    { label: "Tutup Buku", value: "—" },
  ];

  return (
    <div className="flex h-screen flex-col bg-gf-bg">
      <MenuBar onSelect={onSelect} />
      <Toolbar />

      <div className="relative flex-1 overflow-auto p-2">
        {/* background splash ala GF */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <span className="text-[64px] font-bold tracking-tight text-gf-accent">GF-AKUNTANSI</span>
        </div>

        <div className="relative w-[520px]">
          <MdiWindow
            title={view === "home" ? "Menu Utama" : `Menu ${view}`}
            onClose={() => {
              setView("home");
              setMessage("");
            }}
          >
            {view === "home" ? (
              <div className="px-3 pb-2 pt-1">
                <div className="mb-2 text-center text-[11px] font-bold text-gf-text">{COMPANY}</div>
                <div className="grid grid-cols-3 gap-2">
                  {GF_HOME_TILES.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => onTile(t.tag ?? t.label)}
                      className="gf-3d flex flex-col items-center bg-gf-panel transition-transform hover:-translate-y-[1px] active:translate-y-0"
                      title={t.label}
                    >
                      <Image src={t.icon} alt={t.label} width={124} height={140} className="block" />
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <InfoBox rows={infoRows} />
                </div>
              </div>
            ) : (
              <div className="px-3 pb-3 pt-1">
                <button
                  type="button"
                  className="gf-3d mb-2 w-full bg-gf-panel py-[3px] text-[12px] hover:bg-gf-hl hover:text-white"
                  onClick={() => setView("home")}
                >
                  Menu Utama (ESC)
                </button>
                <div className="grid grid-cols-2 gap-1">
                  {group?.items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      disabled={it.blocked}
                      onClick={() => onSelect(view, it)}
                      className={`gf-3d flex items-center justify-between bg-gf-panel px-2 py-[3px] text-left text-[12px] ${
                        it.blocked ? "cursor-not-allowed text-gf-muted/60" : "hover:bg-gf-hl hover:text-white"
                      }`}
                      title={it.blocked ? "Dinonaktifkan (destruktif/berat)" : it.label}
                    >
                      <span>{it.label}</span>
                      {it.hotkey && <span className="text-[11px] opacity-70">{it.hotkey}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </MdiWindow>
        </div>
      </div>

      <StatusBar message={message} />
    </div>
  );
}
