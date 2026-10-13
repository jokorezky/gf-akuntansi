# Matriks Verifikasi 1:1 — GF Akuntansi vs Clone (Fase V)

> Kolom level = kedalaman UI yang diwajibkan: L1 list · L2 form+tab · L3 dialog/aksi tombol · L4 sub-dialog/aksi lanjutan.
> `[x]` = terverifikasi + bukti (deep observe + CRUD/MATH/RELASI test + screenshot). `[~]` = sebagian/scaffold (tercatat sisanya). `[ ]` = belum.
> **Update: 13 Okt 2026 (V4 Re-check)** — semua `[ ]` diisi status nyata; regresi 23/23 quick_test PASS; 53 rute FE HTTP 200.

| # | Layar (menu id) | L1 | L2 | L3 | L4 | spec | data | crud | ikon |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Shell/Menu Utama (32769/24514) | [x] | - | [x] | [~] | [x] | [x] | - | [x] |
| 2 | Menu Aplikasi (24486 User Profile) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [~] |
| 3 | Karyawan (24553) | [x] | [x] | [x] | [~] | [x] | [x] | [x] | [x] |
| 4 | Vendor (24554) | [x] | [x] | [x] | [~] | [x] | [x] | [x] | [x] |
| 5 | Pelanggan (24556) | [x] | [x] | [x] | [~] | [x] | [x] | [x] | [x] |
| 6 | Item (24558) | [x] | [x] | [x] | [~] | [x] | [x] | [x] | [x] |
| 7 | Sisa Stock (24559) | [x] | - | [x] | [~] | [x] | [x] | - | [x] |
| 8 | Purchase Order (24562) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 9 | Pembelian (24566) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 10 | Retur Pembelian (24567) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 11 | Deposit (24572) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 12 | Pembayaran Hutang (24573) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 13 | Daftar Hutang (24575) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 14 | Sales Order (24593) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 15 | Penjualan Eceran (24598) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 16 | Penjualan (24600) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 17 | Retur Penjualan (24602) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 18 | Penerimaan Piutang (24610) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 19 | Daftar Piutang (24612) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 20 | Kas Masuk (24620) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 21 | Kas Keluar (24621) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 22 | Transfer Kas (24622) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 23 | Cari CH/BG Masuk (24624) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 24 | Cari CH/BG Keluar (24625) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 25 | Pencairan CH/BG Masuk (24627) | [x] | - | [x] | [~] | [~] | [x] | [x] | [x] |
| 26 | Pencairan CH/BG Keluar (24628) | [x] | - | [x] | [~] | [~] | [x] | [x] | [x] |
| 27 | Aktiva Tetap (24635) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 28 | Jurnal Pembukuan (24637) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 29 | Cek Kurs Jurnal (24639) | [x] | - | [x] | [~] | [x] | [x] | - | [x] |
| 30 | Cek Perantara (24640) | [x] | - | [x] | [~] | [x] | [x] | - | [x] |
| 31 | Saldo Akhir Perkiraan (24641) | [x] | - | [x] | [~] | [x] | [x] | - | [x] |
| 32 | Buku Besar (24642) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 33 | Laporan Keuangan (24644) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 34 | Promosi (24646) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 35 | Barang Promosi (24647) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 36 | Barang Transfer (24650) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 37 | Barang Untransfer (24651) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 38 | Pindah Gudang (24652) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 39 | Barang Produksi (24654) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 40 | Barang Expired (24656) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 41 | Barang Masuk (24658) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 42 | Barang Keluar (24659) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 43 | Kartu Stock (24661) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 44 | Kartu Hutang (24662) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 45 | Kartu Piutang (24663) | [x] | - | [x] | [~] | [~] | [x] | - | [x] |
| 46 | Validasi Barang Keluar (24665) | [x] | - | [x] | [~] | [~] | [x] | [~] | [x] |
| 47 | Fast Reports (24668) | [x] | - | [x] | [x] | [x] | [x] | - | [x] |
| 48 | Laporan /laporan (viewer + .rpt) | [x] | - | [x] | [~] | [x] | [x] | - | [x] |
| 49 | Sistem Setup: List (24520) | [x] | [x] | [~] | [~] | [~] | [x] | [~] | [~] |
| 50 | Sistem Setup: Kode Perkiraan (24521) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 51 | Sistem Setup: Tipe Pembayaran (24524) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 52 | Sistem Setup: Eceran List (24525) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 53 | Sistem Setup: Konfigurasi (24532/24533) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [~] |
| 54 | Antar Cabang: Pembelian (24632) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 55 | Antar Cabang: Penjualan (24633) | [x] | [x] | [x] | [~] | [~] | [x] | [x] | [x] |
| 56 | **V5 SHORTCUT AUDIT (semua layar)** | [x] | [x] | [x] | [~] | [x] | [x] | [x] | [x] |

> Catatan: L4 `[~]` = aksi lanjutan yang sudah teridentifikasi tapi belum di-dalami penuh pada tiap layar (mis. proses massal "Tutup PO/SO", posting jurnal otomatis, dekode bitmap security). `[~]` spesifikasi = belum ada file di `docs/specs/` untuk layar tsb (spec menyatu di PROGRESS).
> Verifikasi V4 (13 Okt 2026): regresi **23/23 quick_test PASS**, **53/53 rute FE HTTP 200**, data `s_kontro` sempat rusak oleh uji lama → **dipulihkan dari S_KONTRO.G8A (DBF)** dan API `simpanProfil` dikeraskan (COALESCE + clear-via-"").
