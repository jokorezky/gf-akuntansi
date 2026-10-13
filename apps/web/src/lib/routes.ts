import { GF_MENU } from "@/lib/gf-menu";

/** Peta menu id GF → rute web (layar yang sudah diimplementasikan). Dipakai Shell (dashboard) + layout layar. */
export const ROUTES: Record<number, string> = {
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
  24665: "/validasi-barang-keluar",
  24521: "/kode-perkiraan",
  24524: "/tipe-pembayaran",
  24525: "/eceran-list",
  24532: "/konfigurasi",
  24533: "/konfigurasi",
  24486: "/user-profile",
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

export function routeFor(id: number): string | undefined {
  return ROUTES[id];
}

/** Label grup menu untuk pesan status bar. */
export function groupOf(id: number): string | undefined {
  for (const g of GF_MENU) if (g.items.some((i) => i.id === id)) return g.label;
  return undefined;
}
