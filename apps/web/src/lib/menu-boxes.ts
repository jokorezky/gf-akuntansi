/** AUTO-GENERATED oleh tools/gf-observe/crop_menu_group_icons.py — layout + ikon menu box GF. */
export type GfBoxButton = {
  id?: number; label: string; icon: string; blocked?: boolean; small?: boolean;
  x: number; y: number; w: number; h: number;
};
export type GfMenuBox = { slug: string; group: string; title: string; ratio: number; items: GfBoxButton[] };
export const GF_MENU_BOXES: GfMenuBox[] = [
  {
    slug: "menu-utama", group: "Menu Utama", title: "Menu Utama", ratio: 1.648,
    items: [
      { label: "Aplikasi", icon: "/gf-icons/menu/menu-utama/aplikasi.png", blocked: false, small: false, x: 2.96, y: 7.39, w: 30.26, h: 21.36 },
      { label: "Sistem Setup", icon: "/gf-icons/menu/menu-utama/sistem-setup.png", blocked: false, small: false, x: 34.54, y: 7.39, w: 30.26, h: 21.36 },
      { label: "Master File", icon: "/gf-icons/menu/menu-utama/master-file.png", blocked: false, small: false, x: 66.12, y: 7.39, w: 30.26, h: 21.36 },
      { label: "Pembelian", icon: "/gf-icons/menu/menu-utama/pembelian.png", blocked: false, small: false, x: 2.96, y: 30.34, w: 30.26, h: 21.76 },
      { label: "Penjualan", icon: "/gf-icons/menu/menu-utama/penjualan.png", blocked: false, small: false, x: 34.54, y: 30.34, w: 30.26, h: 21.76 },
      { label: "Antar Cabang", icon: "/gf-icons/menu/menu-utama/antar-cabang.png", blocked: false, small: false, x: 66.12, y: 30.34, w: 30.26, h: 21.76 },
      { label: "Kas", icon: "/gf-icons/menu/menu-utama/kas.png", blocked: false, small: false, x: 2.96, y: 52.69, w: 30.26, h: 21.36 },
      { label: "GL", icon: "/gf-icons/menu/menu-utama/gl.png", blocked: false, small: false, x: 34.54, y: 52.69, w: 30.26, h: 21.36 },
      { label: "Lainnya", icon: "/gf-icons/menu/menu-utama/lainnya.png", blocked: false, small: false, x: 66.12, y: 52.69, w: 30.26, h: 21.36 },
      { label: "Bantuan", icon: "/gf-icons/menu/menu-utama/bantuan.png", blocked: false, small: false, x: 2.96, y: 75.85, w: 30.26, h: 21.76 },
      { label: "Log Off", icon: "/gf-icons/menu/menu-utama/log-off.png", blocked: false, small: false, x: 34.54, y: 75.85, w: 30.26, h: 21.76 },
      { label: "Exit", icon: "/gf-icons/menu/menu-utama/exit.png", blocked: false, small: false, x: 66.12, y: 75.85, w: 30.26, h: 21.76 },
    ],
  },
  {
    slug: "aplikasi", group: "Aplikasi", title: "Menu Aplikasi", ratio: 1.648,
    items: [
      { id: 24486, label: "User Profile", icon: "/gf-icons/menu/aplikasi/user-profile.png", blocked: false, small: false, x: 34.54, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24489, label: "Create Indexes", icon: "/gf-icons/menu/aplikasi/create-indexes.png", blocked: true, small: false, x: 2.96, y: 40.72, w: 30.26, h: 23.95 },
      { id: 24490, label: "Repair Database", icon: "/gf-icons/menu/aplikasi/repair-database.png", blocked: true, small: false, x: 34.54, y: 40.72, w: 30.26, h: 23.95 },
      { id: 24491, label: "Check Database", icon: "/gf-icons/menu/aplikasi/check-database.png", blocked: true, small: false, x: 66.12, y: 40.72, w: 30.26, h: 23.95 },
      { id: 24492, label: "Hapus Cache Laporan", icon: "/gf-icons/menu/aplikasi/hapus-cache-laporan.png", blocked: true, small: false, x: 2.96, y: 66.47, w: 30.26, h: 23.95 },
      { id: 24497, label: "Backup Restore", icon: "/gf-icons/menu/aplikasi/backup-restore.png", blocked: true, small: false, x: 34.54, y: 66.47, w: 30.26, h: 23.95 },
      { id: 24500, label: "Add Background", icon: "/gf-icons/menu/aplikasi/add-background.png", blocked: true, small: false, x: 66.12, y: 66.47, w: 30.26, h: 23.95 },
    ],
  },
  {
    slug: "sistem-setup", group: "Sistem Setup", title: "Menu Sistem Setup", ratio: 1.648,
    items: [
      { id: 24521, label: "Kode Perkiraan", icon: "", blocked: false, small: true, x: 2.96, y: 15.17, w: 46.05, h: 6.59 },
      { id: 24524, label: "Setup Penjualan Eceran", icon: "", blocked: false, small: true, x: 50.33, y: 15.17, w: 46.05, h: 6.59 },
      { id: 24520, label: "List (Mata Uang, Kurs, Negara, dsbnya)", icon: "/gf-icons/menu/sistem-setup/list.png", blocked: false, small: false, x: 2.96, y: 22.36, w: 30.26, h: 23.95 },
      { id: 24532, label: "Sistem Konfigurasi", icon: "/gf-icons/menu/sistem-setup/sistem-konfigurasi.png", blocked: false, small: false, x: 34.54, y: 22.36, w: 30.26, h: 23.95 },
      { id: 24533, label: "PC Konfigurasi", icon: "/gf-icons/menu/sistem-setup/pc-konfigurasi.png", blocked: false, small: false, x: 66.12, y: 22.36, w: 30.26, h: 23.95 },
      { id: 24540, label: "Set Proteksi Data", icon: "/gf-icons/menu/sistem-setup/set-tanggal-proteksi.png", blocked: true, small: false, x: 2.96, y: 47.31, w: 30.26, h: 23.95 },
      { id: 24543, label: "Tutup Hari", icon: "/gf-icons/menu/sistem-setup/tutup-hari.png", blocked: true, small: false, x: 34.54, y: 47.31, w: 30.26, h: 23.95 },
      { id: 24544, label: "Reset Tutup Hari", icon: "/gf-icons/menu/sistem-setup/reset-tutup-hari.png", blocked: true, small: false, x: 66.12, y: 47.31, w: 30.26, h: 23.95 },
      { id: 24550, label: "Tutup Tahun Pembukuan", icon: "/gf-icons/menu/sistem-setup/tutup-tahun.png", blocked: true, small: false, x: 2.96, y: 71.86, w: 30.26, h: 23.95 },
      { id: 24551, label: "Hapus Data s/d Tanggal", icon: "/gf-icons/menu/sistem-setup/hapus-data.png", blocked: true, small: false, x: 34.54, y: 71.86, w: 30.26, h: 23.95 },
      { id: 24537, label: "Buat Jurnal Khusus (Transaksi)", icon: "/gf-icons/menu/sistem-setup/buat-jurnal.png", blocked: true, small: false, x: 66.12, y: 71.86, w: 30.26, h: 23.95 },
    ],
  },
  {
    slug: "master-file", group: "Master File", title: "Menu Master File", ratio: 1.648,
    items: [
      { id: 24553, label: "Karyawan", icon: "/gf-icons/menu/master-file/karyawan.png", blocked: false, small: false, x: 34.54, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24554, label: "Vendor", icon: "/gf-icons/menu/master-file/vendor.png", blocked: false, small: false, x: 18.75, y: 41.72, w: 30.26, h: 23.75 },
      { id: 24556, label: "Pelanggan", icon: "/gf-icons/menu/master-file/pelanggan.png", blocked: false, small: false, x: 50.33, y: 41.72, w: 30.26, h: 23.75 },
      { id: 24558, label: "Item", icon: "/gf-icons/menu/master-file/item.png", blocked: false, small: false, x: 18.75, y: 68.06, w: 30.26, h: 23.95 },
      { id: 24559, label: "Sisa Stock", icon: "/gf-icons/menu/master-file/sisa-stock.png", blocked: false, small: false, x: 50.33, y: 68.06, w: 30.26, h: 23.95 },
    ],
  },
  {
    slug: "pembelian", group: "Pembelian", title: "Menu Pembelian", ratio: 1.648,
    items: [
      { id: 24562, label: "Purchase Order", icon: "/gf-icons/menu/pembelian/purchase-order.png", blocked: false, small: false, x: 34.54, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24566, label: "Pembelian", icon: "/gf-icons/menu/pembelian/pembelian.png", blocked: false, small: false, x: 2.96, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24567, label: "Retur Pembelian", icon: "/gf-icons/menu/pembelian/retur-pembelian.png", blocked: false, small: false, x: 34.54, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24572, label: "Deposit", icon: "/gf-icons/menu/pembelian/deposit.png", blocked: false, small: false, x: 34.54, y: 64.67, w: 30.26, h: 23.95 },
      { id: 24573, label: "Pembayaran Hutang", icon: "/gf-icons/menu/pembelian/bayar-hutang.png", blocked: false, small: false, x: 66.12, y: 64.67, w: 30.26, h: 23.95 },
      { id: 24575, label: "Daftar Hutang", icon: "", blocked: false, small: true, x: 2.96, y: 89.42, w: 93.42, h: 7.19 },
    ],
  },
  {
    slug: "penjualan", group: "Penjualan", title: "Menu Penjualan", ratio: 1.648,
    items: [
      { id: 24593, label: "Sales Order", icon: "/gf-icons/menu/penjualan/sales-order.png", blocked: false, small: false, x: 34.54, y: 12.77, w: 30.26, h: 20.76 },
      { id: 24598, label: "Penjualan Eceran", icon: "/gf-icons/menu/penjualan/penjualan-eceran.png", blocked: false, small: false, x: 2.96, y: 34.33, w: 30.26, h: 20.76 },
      { id: 24600, label: "Penjualan", icon: "/gf-icons/menu/penjualan/penjualan.png", blocked: false, small: false, x: 34.54, y: 34.33, w: 30.26, h: 20.76 },
      { id: 24602, label: "Retur Penjualan", icon: "/gf-icons/menu/penjualan/retur-penjualan.png", blocked: false, small: false, x: 66.12, y: 34.33, w: 30.26, h: 20.76 },
      { id: 24610, label: "Penerimaan Piutang", icon: "/gf-icons/menu/penjualan/bayar-piutang.png", blocked: false, small: false, x: 2.96, y: 77.45, w: 30.26, h: 20.76 },
      { id: 24612, label: "Daftar Piutang", icon: "", blocked: false, small: true, x: 34.54, y: 92.02, w: 61.84, h: 6.19 },
    ],
  },
  {
    slug: "antar-cabang", group: "Antar Cabang", title: "Menu Antar Cabang", ratio: 1.648,
    items: [
      { id: 24632, label: "Pembelian", icon: "/gf-icons/menu/antar-cabang/pembelian.png", blocked: false, small: false, x: 34.54, y: 20.96, w: 30.26, h: 23.75 },
      { id: 24633, label: "Penjualan", icon: "/gf-icons/menu/antar-cabang/penjualan.png", blocked: false, small: false, x: 34.54, y: 47.31, w: 30.26, h: 23.95 },
    ],
  },
  {
    slug: "kas", group: "Kas", title: "Menu Kas", ratio: 1.648,
    items: [
      { id: 24620, label: "Kas Masuk", icon: "/gf-icons/menu/kas/kas-masuk.png", blocked: false, small: false, x: 2.96, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24624, label: "Cari CH BG", icon: "/gf-icons/menu/kas/cari-ch-bg.png", blocked: false, small: false, x: 34.54, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24627, label: "Cair CH/BG", icon: "/gf-icons/menu/kas/cair-ch-bg.png", blocked: false, small: false, x: 66.12, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24621, label: "Kas Keluar", icon: "/gf-icons/menu/kas/kas-keluar.png", blocked: false, small: false, x: 2.96, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24625, label: "Cari CH BG", icon: "/gf-icons/menu/kas/cari-ch-bg-2.png", blocked: false, small: false, x: 34.54, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24628, label: "Cair CH/BG", icon: "/gf-icons/menu/kas/cair-ch-bg-2.png", blocked: false, small: false, x: 66.12, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24622, label: "Transfer Kas", icon: "/gf-icons/menu/kas/transfer-kas.png", blocked: false, small: false, x: 2.96, y: 64.67, w: 30.26, h: 23.95 },
    ],
  },
  {
    slug: "gl", group: "GL", title: "Menu GL", ratio: 1.648,
    items: [
      { id: 24635, label: "Aktiva Tetap", icon: "/gf-icons/menu/gl/aktiva-tetap.png", blocked: false, small: false, x: 16.12, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24637, label: "Jurnal", icon: "/gf-icons/menu/gl/jurnal.png", blocked: false, small: false, x: 51.64, y: 15.17, w: 30.26, h: 23.95 },
      { id: 24639, label: "Cek Kurs", icon: "/gf-icons/menu/gl/cek-kurs.png", blocked: false, small: false, x: 16.12, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24640, label: "Cek Perantara", icon: "/gf-icons/menu/gl/cek-perantara.png", blocked: false, small: false, x: 51.64, y: 40.12, w: 30.26, h: 23.75 },
      { id: 24642, label: "Buku Besar", icon: "/gf-icons/menu/gl/buku-besar.png", blocked: false, small: false, x: 16.12, y: 64.67, w: 30.26, h: 23.95 },
      { id: 24644, label: "Laporan", icon: "/gf-icons/menu/gl/laporan.png", blocked: false, small: false, x: 51.64, y: 64.67, w: 30.26, h: 23.95 },
    ],
  },
  {
    slug: "lainnya", group: "Lainnya", title: "Menu Lainnya", ratio: 1.648,
    items: [
      { id: 24646, label: "Promosi", icon: "/gf-icons/menu/lainnya/promosi.png", blocked: false, small: false, x: 2.96, y: 9.58, w: 30.26, h: 23.95 },
      { id: 24647, label: "Barang Promosi", icon: "/gf-icons/menu/lainnya/barang-promosi.png", blocked: false, small: false, x: 34.54, y: 9.58, w: 30.26, h: 23.95 },
      { id: 24656, label: "Barang Expired", icon: "/gf-icons/menu/lainnya/barang-expired.png", blocked: false, small: false, x: 66.12, y: 9.58, w: 30.26, h: 23.95 },
      { id: 24650, label: "Barang Transfer", icon: "/gf-icons/menu/lainnya/transfer.png", blocked: false, small: false, x: 2.96, y: 34.33, w: 30.26, h: 23.95 },
      { id: 24651, label: "Barang Untransfer", icon: "/gf-icons/menu/lainnya/untransfer.png", blocked: false, small: false, x: 34.54, y: 34.33, w: 30.26, h: 23.95 },
      { id: 24652, label: "Barang Pindah Gudang", icon: "/gf-icons/menu/lainnya/pindah-gudang.png", blocked: false, small: false, x: 66.12, y: 34.33, w: 30.26, h: 23.95 },
      { id: 24658, label: "Barang Masuk (Penyesuaian)", icon: "/gf-icons/menu/lainnya/barang-masuk.png", blocked: false, small: false, x: 2.96, y: 59.28, w: 30.26, h: 23.95 },
      { id: 24659, label: "Barang Keluar (Rusak/Hilang/Free/...)", icon: "/gf-icons/menu/lainnya/barang-keluar.png", blocked: false, small: false, x: 34.54, y: 59.28, w: 30.26, h: 23.95 },
      { id: 24667, label: "Proses Laporan Total Transaksi", icon: "/gf-icons/menu/lainnya/laporan-total.png", blocked: true, small: false, x: 66.12, y: 59.28, w: 30.26, h: 23.95 },
      { id: 24661, label: "Kartu Stock", icon: "", blocked: false, small: true, x: 2.96, y: 84.63, w: 46.05, h: 6.59 },
      { id: 24662, label: "Kartu Hutang", icon: "", blocked: false, small: true, x: 2.96, y: 92.02, w: 46.05, h: 6.19 },
      { id: 24663, label: "Kartu Piutang", icon: "", blocked: false, small: true, x: 50.33, y: 92.02, w: 46.05, h: 6.19 },
      { id: 24665, label: "Validasi Barang Keluar", icon: "", blocked: false, small: true, x: 50.33, y: 84.63, w: 46.05, h: 6.59 },
    ],
  },
];
