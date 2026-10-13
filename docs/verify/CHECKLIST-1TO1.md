# CHECKLIST 1:1 — GF Akuntansi ↔ Clone (localhost:3000)

> **Sumber GF:** `tools/gf-observe/native_menu.json` (89 item menu, 9 grup) + harness observe + screenshot pasangan.
> **Dibuat:** 13 Okt 2026 (F1 plan sertifikasi 1:1) · **Diupdate tanpa henti** tiap layar selesai diperiksa.
> **Target:** fokus data minimarket (modul hotel/forecasting = N/A) · deploy localhost. Semua tabel **15 baris/halaman + pager**.

**Dimensi audit per layar (kolom B):**
`H`=Header · `F`=Footer · `B`=Body/Fields · `I`=Inputs (mask/default/validasi) · `T`=Tabs · `G`=Grid & urutan kolom · `L`=Logic 1:1 (MATH CHECK input sama → output sama) · `R`=Relasi tabel teruji · `S`=Shortcut teruji (GF+clone) · `K`=Ikon/tombol berfungsi · `A`=API dipanggil benar · `P`=Pagination 15+pager · `FM`=Format angka/tanggal/jam 1:1 · `C`=CRUD bersih · `Bk`=Bukti screenshot pair

**Status:** `[x]` terverifikasi 1:1 · `[~]` sebagian (sudah V2-deep, menunggu audit penuh) · `[ ]` belum · `[NA]` tidak berlaku (minimarket/web)

---

## A. Inventaris Menu GF (89 item) vs Clone

| id | Menu GF | Grup | Rute clone | Status | Catatan |
|---|---|---|---|---|---|
| 32769 | Menu Utama | Aplikasi | `/` | [~] | shell/menu sudah replika; audit dropdown penuh F2 |
| 24486 | User Profile | Aplikasi | `/user-profile` | [~] | V2-deep + Duplicate; audit penuh |
| 24489 | Create Indexes | Aplikasi | — | [ ] | adaptasi-web: REINDEX (F3) |
| 24490 | Repair Databases | Aplikasi | — | [ ] | adaptasi-web: VACUUM/REINDEX (F3) |
| 24491 | Check Databases | Aplikasi | — | [ ] | adaptasi-web: integrity/FK check (F3) |
| 24492 | Hapus Cache Laporan | Aplikasi | — | [ ] | pemulih penting «Sistem dalam proses laporan» (F3) |
| 24493 | Hapus File Sementara | Aplikasi | — | [ ] | adaptasi-web: cleanup temp (F3) |
| 24495 | Hapus Seluruh Data | Aplikasi | — | [ ] | implement w/ konfirmasi ganda (F3) |
| 24497 | Backup or Restore Data | Aplikasi | — | [ ] | UI pg_dump/restore (F3 — wajib produksi) |
| 24500 | Add New Background | Aplikasi | — | [ ] | paritas background GF (clone skrg pakai default abu) — F3 |
| 24501 | Show Next Background | Aplikasi | — | [ ] | F3 (ganti background) |
| 24502 | Delete Current Background | Aplikasi | — | [ ] | F3 |
| 24504 | Export Data | Aplikasi | — | [ ] | CSV per tabel (F3) |
| 24505 | Import Data | Aplikasi | — | [ ] | CSV import (F3) |
| 24514 | Tampil Kotak Menu | Aplikasi | `/` | [x] | menu box shell ada |
| 24517 | Log Off (Alt+F10) | Aplikasi | global | [x] | GlobalShortcuts + guard modal |
| 24518 | Exit (Alt+F4) | Aplikasi | — | [NA] | web: tutup tab (tanpa aksi) |
| 24520 | List (MU/Negara/Daerah) | Setup | — | [~] | observe 11 tab; FE belum (F3) |
| 24521 | Kode Perkiraan | Setup | `/kode-perkiraan` | [~] | V2-deep |
| 24524 | Tipe Pembayaran | Setup | `/tipe-pembayaran` | [~] | V2-deep |
| 24525 | Eceran List | Setup | `/eceran-list` | [~] | V2-deep |
| 24529 | POS Export Data | Setup | — | [ ] | adaptasi export (F3) |
| 24530 | POS Import Data | Setup | — | [ ] | adaptasi import (F3) |
| 24532 | Sistem Konfigurasi | Setup | `/konfigurasi` | [~] | s_kontro 1141 kolom |
| 24533 | PC Konfigurasi | Setup | `/konfigurasi` | [~] | gabung 1 halaman; audit selisih |
| 24537 | Buat Jurnal Khusus | Setup | — | [ ] | F3 |
| 24540 | Set Proteksi Data | Setup | — | [ ] | F3 |
| 24542 | HPP Testing | Setup | — | [ ] | F3 |
| 24543 | Tutup Hari | Setup | — | [ ] | F3 |
| 24544 | Reset Tutup Hari | Setup | — | [ ] | F3 |
| 24548 | Proses Hitung Point | Setup | — | [ ] | F3 |
| 24550 | Tutup Tahun Pembukuan | Setup | — | [ ] | F3 |
| 24551 | Hapus Data s/d Tanggal | Setup | — | [ ] | F3 |
| 24553 | Karyawan | Master | `/master/karyawan` | [~] | V2 100% |
| 24554 | Vendor | Master | `/master/vendor` | [~] | V2 100% |
| 24556 | Pelanggan (F2) | Master | `/master/pelanggan` | [~] | V2 100% |
| 24558 | Item (F4) | Master | `/master/item` | [~] | V2 100% |
| 24559 | Sisa Stock | Master | `/master/sisa-stock` | [~] | V2 100% |
| 24562 | Purchase Order | Pembelian | `/purchase-order` | [~] | V2-deep |
| 24566 | Pembelian (F5) | Pembelian | `/pembelian` | [~] | V2-deep |
| 24567 | Retur Pembelian | Pembelian | `/retur-pembelian` | [~] | V2-deep |
| 24572 | Deposit | Pembelian | `/deposit-pembelian` | [~] | V2-deep |
| 24573 | Pembayaran Hutang (Ctrl+H) | Pembelian | `/pembayaran-hutang` | [~] | V2-deep |
| 24575 | Daftar Hutang (Ctrl+F5) | Pembelian | `/daftar-hutang` | [~] | V2-deep |
| 24593 | Sales Order (Ctrl+F7) | Penjualan | `/sales-order` | [~] | V2-deep + relasi |
| 24598 | Penjualan Eceran (F7) | Penjualan | `/penjualan-eceran` | [~] | POS V2-deep |
| 24600 | Penjualan (F8) | Penjualan | `/penjualan` | [~] | V2-deep |
| 24602 | Retur Penjualan | Penjualan | `/retur-penjualan` | [~] | V2-deep |
| 24603 | Export Penjualan ke Web | Penjualan | — | [ ] | F3 |
| 24610 | Penerimaan Piutang (Ctrl+P) | Penjualan | `/penerimaan-piutang` | [~] | V2-deep |
| 24612 | Daftar Piutang (Ctrl+F8) | Penjualan | `/daftar-piutang` | [~] | V2-deep |
| 24620 | Kas Masuk (Ctrl+M) | Kas | `/kas-masuk` | [~] | V2-deep + capture-phase |
| 24621 | Kas Keluar (Ctrl+K) | Kas | `/kas-keluar` | [~] | V2-deep + capture-phase |
| 24622 | Transfer Kas | Kas | `/transfer-kas` | [~] | V2-deep |
| 24624 | Cari CH/BG Kas Masuk | Kas | `/cari-chbg-masuk` | [~] | Fase C |
| 24625 | Cari CH/BG Kas Keluar | Kas | `/cari-chbg-keluar` | [~] | Fase C |
| 24627 | Pencairan CH/BG Kas Masuk | Kas | `/pencairan-chbg-masuk` | [~] | Fase C |
| 24628 | Pencairan CH/BG Kas Keluar | Kas | `/pencairan-chbg-keluar` | [~] | Fase C |
| 24632 | Pembelian Antar Cabang | Antar Cabang | `/pembelian-antar-cabang` | [~] | Fase D |
| 24633 | Penjualan Antar Cabang | Antar Cabang | `/penjualan-antar-cabang` | [~] | Fase D |
| 24635 | Aktiva Tetap | GL | `/aktiva-tetap` | [~] | V2-pass |
| 24637 | Jurnal Pembukuan | GL | `/jurnal` | [~] | V2-pass |
| 24639 | Cek Kurs Jurnal | GL | `/gl/cek-kurs-jurnal` | [~] | V2-pass |
| 24640 | Cek Perkiraan Perantara | GL | `/gl/cek-perantara` | [~] | V2-pass |
| 24641 | Saldo Akhir Perkiraan | GL | `/gl/saldo-akhir` | [~] | V2-pass |
| 24642 | Buku Besar | GL | `/buku-besar` | [~] | V2-pass |
| 24644 | Laporan Keuangan | GL | `/laporan-keuangan` | [~] | V2-pass (GF sendiri error K_STKNIL) |
| 24646 | Promosi | Lainnya | `/promosi` | [~] | re-export Barang Promosi |
| 24647 | Barang Promosi | Lainnya | `/barang-promosi` | [~] | V2-deep |
| 24648 | Barang Promosi (Item Group) | Lainnya | — | [ ] | variant; audit + FE (F3) |
| 24650 | Barang Transfer | Lainnya | `/barang-transfer` | [~] | s_stktra/s_stktex |
| 24651 | Barang Untransfer | Lainnya | `/barang-untransfer` | [~] | V2-deep |
| 24652 | Barang Pindah Gudang | Lainnya | `/barang-pindah-gudang` | [~] | s_stkpin/s_stkpex |
| 24654 | Barang Produksi | Lainnya | `/barang-produksi` | [~] | V2-pass |
| 24656 | Barang Expired | Lainnya | `/barang-expired` | [~] | read-only verified |
| 24658 | Barang Masuk | Lainnya | `/barang-masuk` | [~] | V2-pass |
| 24659 | Barang Keluar | Lainnya | `/barang-keluar` | [~] | V2-pass |
| 24661 | Kartu Stock (Ctrl+S) | Lainnya | `/kartu-stock` | [~] | V2-pass |
| 24662 | Kartu Hutang (Ctrl+E) | Lainnya | `/kartu-hutang` | [~] | V2-pass |
| 24663 | Kartu Piutang (Ctrl+U) | Lainnya | `/kartu-piutang` | [~] | V2-pass |
| 24665 | Validasi Barang Keluar | Lainnya | `/validasi-barang-keluar` | [~] | Fase E |
| 24667 | Proses Laporan Total Transaksi | Lainnya | — | [ ] | masuk A4 (F4) |
| 24668 | Fast Reports | Lainnya | `/laporan` | [~] | viewer 557 .rpt + engine |
| 24670 | Help/Bantuan (F1) | Help | global (F1 overlay) | [x] | Key List overlay |
| 24671 | Check Versi Update | Help | — | [NA] | offline |
| 24672 | Download Update | Help | — | [NA] | offline |
| 24673 | Website GFSoft | Help | — | [NA] | eksternal |
| 24675 | DB Info | Help | — | [ ] | F3 |
| 24676 | About GF-Akuntansi (Ctrl+H) | Help | — | [ ] | F3 (Ctrl+H dibatasi browser) |

**Ringkas A:** `[x]` 3 · `[~]` 50 · `[ ]` 22 · `[NA]` 14 = 89.

---

## B. Matriks Audit 1:1 per Layar (52 layar)

> Isi kolom dengan `x` bila lulus audit, `-` bila belum diperiksa; `Bk` = path bukti `docs/verify/1to1/<layar>/`.

| # | Layar (menu id) | H | F | B | I | T | G | L | R | S | K | A | P | FM | C | Bk | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard/Menu Utama (32769) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 2 | User Profile (24486) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 3 | List Setup MU/Negara (24520) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 4 | Kode Perkiraan (24521) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 5 | Tipe Pembayaran (24524) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 6 | Eceran List (24525) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 7 | Sistem Konfigurasi (24532/33) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 8 | Karyawan (24553) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 9 | Vendor (24554) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 10 | Pelanggan (24556) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 11 | Item (24558) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 12 | Sisa Stock (24559) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 13 | Purchase Order (24562) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 14 | Pembelian (24566) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 15 | Retur Pembelian (24567) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 16 | Deposit Pembelian (24572) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 17 | Pembayaran Hutang (24573) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 18 | Daftar Hutang (24575) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 19 | Sales Order (24593) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 20 | Penjualan Eceran/POS (24598) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 21 | Penjualan (24600) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 22 | Retur Penjualan (24602) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 23 | Penerimaan Piutang (24610) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 24 | Daftar Piutang (24612) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 25 | Kas Masuk (24620) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 26 | Kas Keluar (24621) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 27 | Transfer Kas (24622) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 28 | Cari CH/BG Masuk (24624) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 29 | Cari CH/BG Keluar (24625) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 30 | Pencairan CH/BG Masuk (24627) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 31 | Pencairan CH/BG Keluar (24628) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 32 | Pembelian Antar Cabang (24632) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 33 | Penjualan Antar Cabang (24633) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 34 | Aktiva Tetap (24635) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 35 | Jurnal (24637) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 36 | Cek Kurs Jurnal (24639) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 37 | Cek Perantara (24640) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 38 | Saldo Akhir (24641) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 39 | Buku Besar (24642) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 40 | Laporan Keuangan (24644) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 41 | Promosi (24646) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 42 | Barang Promosi (24647) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 43 | Barang Transfer (24650) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 44 | Barang Untransfer (24651) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 45 | Barang Pindah Gudang (24652) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 46 | Barang Produksi (24654) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 47 | Barang Expired (24656) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 48 | Barang Masuk (24658) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 49 | Barang Keluar (24659) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 50 | Kartu Stock (24661) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 51 | Kartu Hutang (24662) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 52 | Kartu Piutang (24663) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 53 | Validasi Barang Keluar (24665) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |
| 54 | Fast Reports / Laporan (24668) | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | [ ] |

---

## C. Laporan (557 file, 9 grup)

| Grup | Total | Implemented | N/A | Pending | Status |
|---|---|---|---|---|---|
| Pembelian | 109 | 109 | 0 | 0 | [x] sweep 0 error |
| Penjualan | 210 | 174 | 36 | 0 | [x] sweep 0 error (hotel N/A) |
| Item & Stock | 43 | 16 | 0 | 27 | [ ] F4 |
| Keuangan / GL | 70 | 20 | 0 | 50 | [ ] F4 |
| Lainnya | 33 | 0 | 0 | 33 | [ ] F4 |
| Form / Template Cetak | 77 | 0 | 0 | 77 | [ ] F4 (print preview minimal) |
| Pelanggan | 8 | 7 | 0 | 1 | [ ] F4 |
| GL & Perkiraan | 4 | 2 | 0 | 2 | [ ] F4 |
| Vendor | 3 | 3 | 0 | 0 | [x] |

---

## D. Global & Produksi

| # | Item | Status | Catatan |
|---|---|---|---|
| D1 | Menu bar dropdown 1:1 (9 grup, label + accelerator kanan) | [ ] | audit F2 |
| D2 | Toolbar ikon individual (V1c) semua berfungsi | [ ] | F3 |
| D3 | Footer/status bar GF (user, tanggal, posisi) 1:1 | [ ] | audit F2 |
| D4 | **Pagination 15 baris + pager** semua tabel & laporan | [ ] | F3 (komponen `Pager` global) |
| D5 | Format angka/tanggal/jam 1:1 di semua grid | [ ] | F2/F3 |
| D6 | Semua tombol Cetak (preview minimal) | [ ] | F3 |
| D7 | Shortcut per layar teruji (GF + clone) | [~] | V5 global ok; per-layar via F2 |
| D8 | API mapping layar→query/mutation benar semua | [ ] | F2/F3 |
| D9 | Backup/Restore UI + backup otomatis sebelum batch | [ ] | F3 |
| D10 | Build API+Web 0 error · lint/typecheck | [~] | jalan; final F6 |
| D11 | Loading/empty/error state semua layar | [ ] | F3 |
| D12 | Guard anti-wipe (insiden s_kontro) di semua simpan | [~] | simpanProfil ok; audit semua F2 |
| D13 | Budget performa: list <2s · laporan <10s | [~] | tuning PG done; ukur per layar F2 |
| D14 | Dokumen operator (run/backup/restore, localhost) | [ ] | F6 |
| D15 | Uji integritas lintas modul (posting flow) | [ ] | F5 |

---

## E. Riwayat Update Checklist

- **13 Okt 2026 (F3-P v6.1: Dashboard Premium FULL)** — Instruksi user dieksekusi: **toolbar strip lama DIHAPUS permanen**, **title bar atas DIHAPUS**, **watermark teks "GF-AKUNTANSI" DIHAPUS**, **tombol window (— ▢ ✕) DIHAPUS** (MdiWindow + header layar pilot; penutupan via tombol "Tutup" toolbar). **Menu Utama jadi dashboard full premium 6 kolom** (`DashboardMenu.tsx`): 12 kartu grup (ikon lucide dalam wadah aksen maroon, sub-label "n menu", hover lift+shadow), klik grup → **submenu full premium** 6 kolom + tombol "‹ Menu Utama (ESC)" + badge hotkey (F2/F4 dst) + ESC keyboard kembali. Kartu Bantuan/Log Off/Exit bergaya muted. Kartu info & status bar tetap (posisi). Bukti: `docs/verify/1to1/shell/clone-modern2.png` + `submenu-modern.png`. Berikutnya: roll pola premium ke semua layar + Pager 15 aktif + Dialog/Toast menyeluruh.
- **13 Okt 2026 (F3-P PILOT: Shell + Master modern)** — Keputusan user: **skin modern penuh (shadcn)**, **posisi wajib sama GF**, semua ikon → **lucide**, tanpa dark mode. Terpasang: `clsx/tailwind-merge/cva/lucide-react/sonner/radix`; `ui/button.tsx` (shadcn-style) + `lib/utils.cn` + `lib/gf-lucide.tsx` (peta label→lucide) + Toaster sonner di layout. Token `gf-*` di-modernkan (nilai baru, nama tetap → seluruh app ikut halus); `.gf-3d` jadi tombol modern; `.gf-window` kartu MDI; scrollbar ramping. **Shell**: title bar modern + badge GF, menubar pills + dropdown rounded, window menu (ikon lucide dalam tile rounded, posisi & ukuran tetap), kartu info emerald (label tidak wrap), status bar pills. **Pilot layar Karyawan**: window card, toolbar lucide (Tambah/Koreksi/Hapus/Tutup — posisi & urutan sama GF), search dengan ikon, tabel modern (header uppercase, hover, kolom & urutan tetap), toast simpan/hapus, modal form modern (tab underline + ikon lucide) — posisi field & tab tetap. Bukti: `docs/verify/1to1/*/clone-modern.png`. **Pending pilot**: validasi "look" oleh user; toolbar strip masih gambar GF (V1c inventory aksi dulu); Pager 15 belum aktif (placeholder "Halaman 1 dari 1"); confirm() native → shadcn Dialog di pass berikutnya.
- **13 Okt 2026 (F2 batch-1: Shell + Master)** — Dibandingkan GF asli (`gf-menuutama.png`, `menu_1_Menu_Master_File.png`, `karyawan*.png`) ↔ clone (`docs/verify/1to1/shell|master-*/clone.png`).
  **Sudah diperbaiki 1:1**: (1) **title bar app** "GF-Akuntansi, Release : 951.1823 Build 2026.06.28" + 3 tombol window; (2) window **Menu Utama**: breadcrumb "Utama/Menu Utama(ESC)" dihapus dari root, diganti **nama perusahaan** biru ("MONI COSMETIC SUPERMARKET"); tombol "Menu Utama (ESC)" tetap (benar, ada di window submenu GF); (3) **kartu info** dipindah jadi **overlay desktop kanan-bawah** (bukan di dalam window), layout GF 2 kolom + baris **Eceran/TGL_KOMP** + **stempel waktu login** hijau + bola 3D merah-biru; (4) **status bar 2 sel** (tanggal | jam, format d/m/Y ✓); (5) lebar window menu ~302px (GF ~305px); (6) **hapus placeholder "Cari ..." di SELURUH 36 layar** (GF box pencarian kosong; ketik = cari).
  **Temuan menunggu tindak lanjut**: (a) GF pakai wallpaper custom (Add Background) → item 24500–24502 dipindah [NA]→[ ]; (b) ukuran/posisi default window list GF perlu diukur live (clone full-width); (c) baris "Total: n" di clone perlu verifikasi perilaku GF saat ada data; (d) audit dropdown menu (9 grup) + toolbar ikon V1c; (e) form karyawan/vendor/pelanggan/item/sisa-stock: lanjut banding form+tab vs GF (batch-2).
- **13 Okt 2026** — File dibuat (F1). Inventaris 89 item menu dari `native_menu.json`; matriks 54 layar; status laporan dari katalog engine (Pembelian 109/109, Penjualan 174+36NA tuntas sweep).
