/**
 * Peta menu GF Akuntansi — diambil dari native menu aplikasi GF yang berjalan
 * (tools/gf-observe/native_menu.json). ID = WM_COMMAND id di GF.
 * Urutan & label persis GF. `blocked` = aksi yang tidak dijalankan (destruktif/berat).
 */
export type GfMenuItem = {
  id: number;
  label: string;
  hotkey?: string;
  blocked?: boolean;
  icon?: string;
};

export type GfMenuGroup = {
  label: string;
  items: GfMenuItem[];
};

export const GF_MENU: GfMenuGroup[] = [
  {
    label: "Aplikasi",
    items: [
      { id: 24486, label: "User Profile" },
      { id: 24489, label: "Create Indexes (Membuat file index baru)", blocked: true },
      { id: 24490, label: "Repair Databases (Memperbaiki database yang rusak)", blocked: true },
      { id: 24491, label: "Check Databases (Mengecek hubungan data antar table)", blocked: true },
      { id: 24492, label: "Hapus Data Sementara Proses Laporan (Cache Laporan)", blocked: true },
      { id: 24493, label: "Hapus File Data Sementara (*.old *.bak *.b01 *.b02 dsbnya)", blocked: true },
      { id: 24495, label: "Hapus Seluruh Data", blocked: true },
      { id: 24497, label: "Backup or Restore Data", blocked: true },
      { id: 24500, label: "Add New Background", blocked: true },
      { id: 24501, label: "Show Next Background", blocked: true },
      { id: 24502, label: "Delete Current Background", blocked: true },
      { id: 24504, label: "Export Data", blocked: true },
      { id: 24505, label: "Import Data", blocked: true },
      { id: 24514, label: "Tampil Kotak Menu" },
      { id: 24517, label: "Log Off", hotkey: "Alt+F10" },
      { id: 24518, label: "Exit", hotkey: "Alt+F4", blocked: true },
      { id: 32769, label: "1 Menu Utama" },
    ],
  },
  {
    label: "Sistem Setup",
    items: [
      { id: 24520, label: "List (List Mata Uang, Kurs, Negara, Daerah, dsbnya)" },
      { id: 24521, label: "Kode Perkiraan" },
      { id: 24524, label: "Tipe Pembayaran (Penj Eceran)" },
      { id: 24525, label: "Eceran List" },
      { id: 24529, label: "POS Export Data Ke Lokasi Folder", blocked: true },
      { id: 24530, label: "POS Import Data Dari Lokasi Folder", blocked: true },
      { id: 24532, label: "Sistem Konfigurasi" },
      { id: 24533, label: "PC Konfigurasi" },
      { id: 24537, label: "Buat Jurnal Khusus (Jurnal Transaksi)", blocked: true },
      { id: 24540, label: "Set Proteksi Data", blocked: true },
      { id: 24542, label: "HPP Testing", blocked: true },
      { id: 24543, label: "Tutup Hari (Tutup Data)", blocked: true },
      { id: 24544, label: "Reset Tutup Hari", blocked: true },
      { id: 24548, label: "Proses Hitung Point", blocked: true },
      { id: 24550, label: "Tutup Tahun Pembukuan", blocked: true },
      { id: 24551, label: "Hapus Data s/d Tanggal", blocked: true },
    ],
  },
  {
    label: "Master File",
    items: [
      { id: 24553, label: "Karyawan" },
      { id: 24554, label: "Vendor" },
      { id: 24556, label: "Pelanggan", hotkey: "F2" },
      { id: 24558, label: "Item", hotkey: "F4" },
      { id: 24559, label: "Sisa Stock" },
    ],
  },
  {
    label: "Pembelian",
    items: [
      { id: 24562, label: "Purchase Order" },
      { id: 24566, label: "Pembelian", hotkey: "F5" },
      { id: 24567, label: "Retur Pembelian" },
      { id: 24572, label: "Deposit" },
      { id: 24573, label: "Pembayaran Hutang", hotkey: "Ctrl+H" },
      { id: 24575, label: "Daftar Hutang", hotkey: "Ctrl+F5" },
    ],
  },
  {
    label: "Penjualan",
    items: [
      { id: 24593, label: "Sales Order", hotkey: "Ctrl+F7" },
      { id: 24598, label: "Penjualan Eceran", hotkey: "F7" },
      { id: 24600, label: "Penjualan", hotkey: "F8" },
      { id: 24602, label: "Retur Penjualan" },
      { id: 24603, label: "Export Penjualan ke Web", blocked: true },
      { id: 24610, label: "Penerimaan Piutang", hotkey: "Ctrl+P" },
      { id: 24612, label: "Daftar Piutang", hotkey: "Ctrl+F8" },
    ],
  },
  {
    label: "Kas",
    items: [
      { id: 24620, label: "Kas Masuk", hotkey: "Ctrl+M" },
      { id: 24621, label: "Kas Keluar", hotkey: "Ctrl+K" },
      { id: 24622, label: "Transfer Kas" },
      { id: 24624, label: "Cari CH/BG/Sub-Catatan Kas Masuk" },
      { id: 24625, label: "Cari CH/BG/Sub-Catatan Kas Keluar" },
      { id: 24627, label: "Pencairan CH/BG Kas Masuk (Modul pencairan CH/BG)" },
      { id: 24628, label: "Pencairan CH/BG Kas Keluar (Modul pencairan CH/BG)" },
    ],
  },
  {
    label: "Antar Cabang",
    items: [
      { id: 24632, label: "Pembelian Antar Cabang" },
      { id: 24633, label: "Penjualan Antar Cabang" },
    ],
  },
  {
    label: "GL",
    items: [
      { id: 24635, label: "Aktiva Tetap" },
      { id: 24637, label: "Jurnal Pembukuan" },
      { id: 24639, label: "Cek Kurs Jurnal" },
      { id: 24640, label: "Cek Perkiraan Perantara" },
      { id: 24641, label: "Saldo Akhir Perkiraan" },
      { id: 24642, label: "Buku Besar" },
      { id: 24644, label: "Laporan Keuangan" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { id: 24646, label: "Promosi" },
      { id: 24647, label: "Barang Promosi" },
      { id: 24648, label: "Barang Promosi (Item Group)" },
      { id: 24650, label: "Barang Transfer" },
      { id: 24651, label: "Barang Untransfer" },
      { id: 24652, label: "Barang Pindah Gudang" },
      { id: 24654, label: "Barang Produksi" },
      { id: 24656, label: "Barang Expired" },
      { id: 24658, label: "Barang Masuk (Penyesuaian Stock)" },
      { id: 24659, label: "Barang Keluar (Rusak/Hilang/Free/...)" },
      { id: 24661, label: "Kartu Stock", hotkey: "Ctrl+S" },
      { id: 24662, label: "Kartu Hutang", hotkey: "Ctrl+E" },
      { id: 24663, label: "Kartu Piutang", hotkey: "Ctrl+U" },
      { id: 24665, label: "Validasi Barang Keluar" },
      { id: 24667, label: "Proses Laporan Total Transaksi", blocked: true },
      { id: 24668, label: "Fast Reports" },
    ],
  },
  {
    label: "Help",
    items: [
      { id: 24670, label: "Help atau Bantuan", hotkey: "F1" },
      { id: 24671, label: "Check Versi Update", blocked: true },
      { id: 24672, label: "Download Update Aplikasi", blocked: true },
      { id: 24673, label: "Website GFSoft Indonesia" },
      { id: 24675, label: "DB Info" },
      { id: 24676, label: "About GF-Akuntansi", hotkey: "Ctrl+H" },
    ],
  },
];

/** 12 tombol kotak Menu Utama GF (urutan tombol: Antar Cabang sebelum Kas). */
export type GfHomeTile = { slug: string; label: string; icon: string; tag?: string };

export const GF_HOME_TILES: GfHomeTile[] = [
  { slug: "aplikasi", label: "Aplikasi", icon: "/gf-icons/aplikasi.png", tag: "Aplikasi" },
  { slug: "sistem-setup", label: "Sistem Setup", icon: "/gf-icons/sistem-setup.png", tag: "Sistem Setup" },
  { slug: "master-file", label: "Master File", icon: "/gf-icons/master-file.png", tag: "Master File" },
  { slug: "pembelian", label: "Pembelian", icon: "/gf-icons/pembelian.png", tag: "Pembelian" },
  { slug: "penjualan", label: "Penjualan", icon: "/gf-icons/penjualan.png", tag: "Penjualan" },
  { slug: "antar-cabang", label: "Antar Cabang", icon: "/gf-icons/antar-cabang.png", tag: "Antar Cabang" },
  { slug: "kas", label: "Kas", icon: "/gf-icons/kas.png", tag: "Kas" },
  { slug: "gl", label: "GL", icon: "/gf-icons/gl.png", tag: "GL" },
  { slug: "lainnya", label: "Lainnya", icon: "/gf-icons/lainnya.png", tag: "Lainnya" },
  { slug: "bantuan", label: "Bantuan", icon: "/gf-icons/bantuan.png", tag: "Help" },
  { slug: "log-off", label: "Log Off", icon: "/gf-icons/log-off.png", tag: "Log Off" },
  { slug: "exit", label: "Exit", icon: "/gf-icons/exit.png", tag: "Exit" },
];
