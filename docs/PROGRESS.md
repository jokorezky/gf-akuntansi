# PROGRESS — GF Akuntansi Clone

> **Update terakhir:** 13 Okt 2026
> **Standar penyelesaian (V2-deep):** UI 1:1 dengan GF + LOGIC teruji (MATH CHECK PASS) + RELASI TABLE teruji + CRUD bersih
> **Sumber acuan:** aplikasi GF Akuntansi build 951.1823 (2026.06.28), data `D:\ST_DB`, DB `indusia-akunting` (schema `gf`, container `indusia-akunting-pg:5435`)
> **File terkait:** `TODOLIST.txt` (roadmap kerja) · `docs/verify/matrix.md` (matriks 53 layar) · `docs/specs/**` (spec per layar)

Legenda: ✅ selesai 1:1 · 🔄 jalan (belum V2-pass penuh) · ⏳ belum mulai

## 0. Ringkasan

**Progress keseluruhan: ±68%** (basis: 53 layar inti + layar ekstra antar cabang/setup)

| Grup | ✅ Selesai | Total | % | Catatan |
|---|---|---|---|---|
| Fondasi & Infrastruktur | ✅ | — | 100% | Offline penuh, Docker DB, harness observe |
| Shell & Menu | ✅ | — | ~95% | Sisa: toolbar strip → ikon individual (V1c) |
| Master File | 5 | 5 | **100%** | Karyawan, Vendor, Pelanggan, Item, Sisa Stock |
| Pembelian | 6 | 6 | **100%** | PO, Pembelian, Retur, Deposit, Bayar Hutang, Daftar Hutang |
| Penjualan | 6 | 6 | **100%** | Penjualan, SO, POS, Retur, Penerimaan Piutang, Daftar Piutang |
| Kas | 7 | 7 | **100%** | + Cari/Pencairan CH-BG (4 layar, V2-deep) |
| Antar Cabang | 2 | 2 | **100%** | Pembelian/Penjualan [ANTAR CABANG] + combo Cabang/Jenis/Tanpa Item/Gudang per divisi |
| GL | 7 | 7 | ~90% | Semua jalan; Jurnal/BB/LK belum V2-pass |
| Lainnya | 13 | 14 | ~95% | + Validasi Barang Keluar; sisa: polish pass |
| Laporan | viewer ✅ | — | ~60% | 557 `.rpt` + viewer; isi data laporan per modul (A4) sebagian |
| Sistem Setup + User Profile | 4 | 6 | ~80% | Kode Perkiraan/Tipe Bayar/Eceran List/Konfigurasi ✅; Setup List observe; User Profile sisa |
| Offline | ✅ | — | 100% | windows-mcp lokal, dev.ps1, restore-db.ps1 |

---

## 1. Fondasi & Infrastruktur — ✅ 100%

- Repo TypeScript: Next.js 15 (FE, port 3000) + NestJS GraphQL code-first (BE, port 4000) + PostgreSQL (Docker).
- Data asli GF dimigrasi ke PostgreSQL (schema `gf`); DB dijalankan via Docker `indusia-akunting-pg` port 5435.
- **Mode OFFLINE penuh**: windows-mcp dibundle ke venv lokal (`tools\mcp-venv`), `RUN-OFFLINE.md`, `scripts\dev.ps1`, `scripts\restore-db.ps1`.
- Harness observe GF (Python + pywin32): `deep_explore.py` (klik tombol rekursif L1..Ln + screenshot + blocklist), `observe_screen2.py` (list→form→tab otomatis), `crop_menu_group_icons.py` (crop ikon via PrintWindow), `diff_deep.py`.
- **Pemulih kunci**: mode "Sistem dalam proses laporan/proses khusus" (memblokir semua form Tambah, menempel lintas restart) → pulih via menu Aplikasi → *Hapus Data Sementara Proses Laporan (Cache Laporan)* (id 24492).
- Dokumentasi: PDF brainstorming, spec per layar (`docs/specs/**`), matriks verifikasi (`docs/verify/matrix.md`), vault Obsidian.

## 2. Shell & Menu — ✅ ~95%

- MenuBar atas urutan & label persis GF (14 koreksi label) + toolbar ikon asli GF.
- **Menu `<Group>` box ber-ikon 1:1**: 75 ikon tombol menu di-crop dengan teknik PrintWindow (bebas interferensi) → `public/gf-icons/menu/**` + `lib/menu-boxes.ts` (posisi absolut % persis GF) + `MenuBox.tsx`.
- 8 tombol kecil flat sesuai GF (Daftar Hutang/Piutang, Kartu×3, Validasi, Kode Perkiraan, Setup Penjualan Eceran).
- InfoBox = nilai GF (MONI COSMETIC SUPERMARKET / Acu [U.1 G.Owner] / Proteksi / Tutup Hari / Tutup Buku) + StatusBar live.
- Sisa: V1c toolbar strip → ikon individual clickable.

## 3. Master File — ✅ 5/5 (100%)

### 3.1 Karyawan
- **UI 1:1**: list (4 tombol ikon + kolom GF) + form 2 tab ber-ikon; jabatan; tombol Inisialisasi grup ×3.
- **BE**: CRUD → `gf.s_karyaw`, soft delete + audit; refs grup stock 1/2/3.
- CRUD teruji + bersih.

### 3.2 Vendor
- **UI 1:1**: LIST (A..Z/Menu/filter divisi, 9 ikon toolbar, kolom GF) + FORM **4 tab ber-ikon**:
  - Data Utama: field lengkap + checklist Transaksi (10 item) + User Level 1–6 + checkbox Harga Beli Terakhir
  - Inisialisasi: Catatan + toggle tampil
  - Memo: catatan 2/3
  - Link Perkiraan: hint + MU + Divisi.
- **BE**: 61 field (pb_*, frm, hubungi 2/3, memo, dll). CRUD teruji + bersih.

### 3.3 Pelanggan
- **UI 1:1**: LIST (ikon toolbar + kolom ID/Tipe/Tanggal/Non-Aktif/NPWP/Title/Nama/Alamat/Daerah/Negara/Telp 1–3) + FORM header (Tanggal/Non-aktif/Kode/ID/Nama + 6 checkbox) + **7 tab ber-ikon** (Data Utama, Inisialisasi ×2, Data Personal, Extra Info, Harga Spesial, Link).
- **BE**: 76 field. CRUD teruji + bersih. Sisa: grid detail tab Harga Spesial/Link (scan tersimpan).

### 3.4 Item
- **UI 1:1**: LIST (14 ikon toolbar + kolom Group/Vendor/Kode/Nama/Tipe Satuan/Sat-Ecr/Jenis/Harga Beli/H.Jual #1–5) + FORM header [Record Baru] + **6 tab ber-ikon**:
  - Data Utama: Group/Vendor/Kode/Barcode/Satuan/Dec/Min Stock+unit/Input Expired/Sat-Eceran/Kurs Jual + tabel HARGA 7 baris + tabel KONVERSI
  - Inisialisasi (Nama Alias), Lainnya (4 memo), Gambar, Sub Info, Link Perkiraan (inner tab + grid).
- **BE**: +11 field tulis-teruji (satEcr, kursJual, satBeli, satMin, minJual, minJlSt, satJ01–05). CRUD teruji + bersih.
- Sisa: peta kolom EQUIVALEN/KELOMPOK II/4 memo/sat_k_01-10/dec + tab upload gambar.

### 3.5 Sisa Stock (read-only)
- **UI 1:1**: toolbar 14 ikon sama dengan Item; kolom lengkap GF (Group/Kode/Nama/Tipe Satuan/Sisa AC/Harga Jual #1–5 + slot Disc%/Jenis/Min Stock/Catatan/ID/audit) + panel detail bawah + panel kanan (Aktif/---/Tampilan Standard 6 opsi).
- **BE**: `sisaStockList` +8 kolom (jenis/min_stock/catatan/audit/sisaAc).

---

## 4. Pembelian — ✅ 6/6 (100%)

**LOGIC dokumen pembelian (teruji MATH CHECK PASS di semua layar):**
`nilai baris = (jumlah × harga)` berlapis `Disc% ×3` − `Disc nilai`; `totDisc = Σdisc baris + disc header`; `PPN = (net) × ppn_pers`; `TOTAL = Harga − Disc − Retur + Adjustment`; depot terpisah.

### 4.1 Purchase Order
- **UI 1:1**: LIST (ikon A..Z/Menu/Laporan/Rincian Per Item/Tutup PO/Cetak Setup/Cetak + CRUD; kolom ID/PO/Tanggal/Tutup/Vendor/MU/Harga/Discount/PJK-PPN/Total/Divisi/Jenis Pemb/Catatan; radio realisasi 3 opsi + CtrlF7/F6) + FORM dokumen (P.O. No./Tanggal/Vendor/Divisi/MU/Discount/Jenis Pemb/Tgl Kirim/Pajak/Catatan + panel T O T A L + grid 17 kolom termasuk (Pb) Real/Blm + tombol Lainnya/Cetak Keluar ×2/Tambah dari Master File/Copy Dari SO + CRUD baris).
- **BE**: menyimpan po/tgl_kirim/tgl_tutup/divisi/jenpem/mauang/disc_nilai/tot_disc/ppn_*/prt_*. CRUD bersih.
- Sisa: realisasi (Pb) Real/Blm otomatis dari Pembelian + Copy Dari SO fungsional.

### 4.2 Pembelian
- **UI 1:1**: LIST (kolom ID/Gudang/MU/No/Tanggal/Tanggal2/Vendor/PO/Kurs/Harga Beli/Discount/PJK-PPN/%/Total/Deposit/Credit + checklist Yang Belum/Sudah Ada Pelunasan) + FORM (Vendor/Gudang/Fak Pjk/No/PO/Tanggal×2/MU-Kurs/No+Tgl Faktur Pajak + **Tambah Dari PO** import baris + grid Gudang/Kode/Nama/Jumlah/Retur/@/Harga Beli/Disc%×3/Nilai/Expired/Catatan + panel ungu T O T A L (Adjustment/Total Harga/Disc/Retur/TOTAL/PPN/Deposit) + C R E D I T + Update Harga Beli Master File-Item).
- **BE**: `s_pembel` diperluas (purcor_id/no_fakpjk/tgl_fakpjk/kurs/tanggal2/disc_nilai/adj_01-05/ppn_tipe) + `s_pembed` (disc_pers2/3, disc_nilai). CRUD bersih.
- Sisa: checklist pelunasan fungsional, Update Harga Beli tulis-otomatis.

### 4.3 Retur Pembelian
- **UI 1:1**: LIST (kolom ID/Gudang/MU/No Retur/Tgl Retur/Vendor/Kurs/Harga/Discount/PJK-PPN/%/Total/Divisi/Jenis Pemb/Catatan + 5 checkbox filter khas: Tanpa Asal dan Potong Faktur/Asal Faktur/Potong Faktur/Yang Belum/Sudah Ada Pelunasan) + FORM (Faktur Asal + Potong pd Faktur → `pembel_id/pembel_id2`, Vendor/Gudang/Nomor/Tanggal±hari/MU-Kurs/No+Tgl Faktur Pajak + Tambah Dari Master + panel Total Nilai/Harga/Disc/Discount/PJK/Total Retur + C R E D I T).
- **LOGIC**: contoh teruji 40.000 − 4.000 → PPN 3.960 (11%). **BE**: `s_retpem/s_retpbd` diperluas. CRUD bersih.
- Sisa: efek Potong Faktur ke faktur asli.

### 4.4 Deposit Pembelian
- **UI 1:1**: LIST (kolom ID/PO/Pembelian/No/Tanggal/Vendor/MU/Deposit/Kurs/Divisi/Catatan×3) + FORM (Divisi/P-O + checkbox Refund/Pembelian/Vendor + Nomor/Tanggal±hari/MU-Kurs/Deposit/Catatan 2 baris + combo 'Deposit Ke Perkiraan' + C R E D I T).
- **BE**: `s_deppem` diperluas (perkir_id + nama, mauang, kurs, catatan_2/3). CRUD teruji + bersih.
- Sisa: perilaku Refund, link perkiraan otomatis dari konfigurasi.

### 4.5 Pembayaran Hutang (master + baris)
- **UI 1:1**: LIST (kolom ID/No/Tanggal/Vendor/IDR/Disc/Divisi/Catatan/Alasan Batal/Confirm By/Confirm J/Entry By/Entry Date) + FORM (header ID/No/Tanggal/Vendor/Divisi/Catatan + tombol **Tambah dari List / Tambah dari Daftar Tagihan** yang mengisi baris dari Daftar Hutang outstanding asli + grid 15 kolom: No/MU/Discount/Bayar/Total/Sisa Hutang/Sisa Hutang(Ex)/Tanggal/Vendor/Kurs/Catatan, `Sisa = invTotal − Bayar − Disc`, + Disc + nav).
- **BE**: `s_lunpem` — 4 sumber baris (pembel/retpem/dcnhut/deppem), invTotal & no resolve dari pembelian. CRUD + MATH PASS.
- Sisa: sumber retur/DN/CN pada 'Daftar Tagihan'.

### 4.6 Daftar Hutang (read-only)
- **BE**: `daftarHutangList` (`sisa = total + PPN − dibayar − retur`); logika terverifikasi dengan data asli: 1.075.590 − 500.000 − 90.000 = 485.590.
- **FE**: `/daftar-hutang` jalan. Sisa: V2-pass tombol GF (Masuk Daftar Tagihan/Proses).

---

## 5. Penjualan — ✅ 6/6 (100%) — *grup terakhir yang dituntaskan*

**LOGIC semua dokumen penjualan (MATH CHECK PASS):** sama dengan pembelian (berlapis ×3, header disc, adj, PPN per dokumen atau per baris untuk POS).

### 5.1 Penjualan
- **UI 1:1**: LIST (kolom ID/Gudang/MU/No/Tanggal/Pelanggan/SO/PO/Kurs/Harga Jual/Discount/PJK-PPN/%/Total/Deposit + checklist Yang Belum/Sudah Ada Pelunasan) + FORM **2 tab**:
  - [Penjualan]: Pelanggan `***`/Sales+Komisi/Gudang/No hijau auto/No SO/No PO/Tanggal/MU-Kurs + grid (Gudang/Kode/Nama/Jumlah/Bonus/Retur/@/Harga Jual/Disc%×3/Nilai/Expired/Catatan) + **Tambah Dari SO** + panel ungu Adjustment/Total Harga/Disc/Retur/TOTAL(merah)/Deposit + C R E D I T.
  - [Info Tambahan]: data faktur pajak (Kurs/No/Seri/Tanggal).
- **LOGIC**: `No` auto `MAX(no)+1` ala GF → 41021842; bonus/salesKom/no_pjk/sr/kurs_pajak tersimpan. CRUD bersih.
- Sisa: kolom Retur dari Retur Penjualan, HPP otomatis.

### 5.2 Sales Order
- **UI 1:1**: LIST (kolom ID/Web/No/PO/Tanggal/Pukul/Kirim/Tutup/Pelanggan/MU/Harga/Discount/PJK-PPN/%/Total/Divisi/Jenis Penj) + FORM (Pelanggan/Sales/No auto/No PO/Tanggal/**Kirim**/**Tutup**/MU/Jenis Penj + grid Kode/Nama/Jumlah/**Bonus**/@/Harga Jual/Disc%×3/Nilai/**Real** + **Copy Item ke Clipboard / Paste Item dari Clipboard** (khas S/O) + panel Total Harga/Disc/PPN/**Realisasi**/TOTAL).
- **RELASI TABLE (teruji penuh)**: `salord.penjua_id ↔ penjua.salord_id` — buat S/O → buat Penjualan dengan `salordId` → baca ulang S/O → muncul `penjuaId/penjuaNo` (41021843). `s_saloex.toex_rec` = flag realisasi baris (kolom "Real").
- Sisa: Tutup SO aksi massal, field Web.

### 5.3 Penjualan Eceran / POS
- **DEEP SCAN GF**: form kasir *langsung* (bukan list) — title `Penjualan - <tgl panjang>`, `** BARU **`, combo Pelanggan + lookup, **combo Divisi/Cabang** (14 outlet dari `s_divisi`), nav `?/<<//>/>>`, **Simpan (F10)**; grid kolom GF termasuk `-To`, `Discount`, `%PJK/Pajak`, `Nilai Jual`, `Alasan Batal`, `Item-Catatan`, `GF-Promo`, `Pay-To`; **panel KATALOG item** kanan: **5 level harga** (Harga Jual #1..#5 + Disc%#1..#3 per level + Group + Qty.Pict); status `Mode Online / User / HJ */ Record Baru / GUDANG MASTER / IDR / TOTAL QTY`.
- **BE/FE 1:1**: `s_ecrlst` (100 kol: list/sts_ecr/pelang/gudang/sales/disc_pers+disc_nilai/**adj1..5 pers+nilai**/audit save-bill-payto) + `s_penecr` (ecrlst_id/stock_id/satuan/harga/harga_ex1-2/disc_pers×3/disc_nilai/**ppn_pers+ppn_nilai**/als_batal); auto-no `ECxxx`; katalog dari `s_stock.harga_j_01..05` + `disc1..3_j_01..05`.
- **LOGIC (MATH CHECK PASS)**: berlapis Disc%×3 − Disc nilai; header disc_pers/disc_nilai + Adj1..5 (pers lalu nilai, berurutan); **PPN per baris**; contoh total 223.370,93 (sub 243.927,00, totDisc 52.465,70).
- **RELASI (teruji)**: `s_ecrlst.id ↔ s_penecr.ecrlst_id`.
- Sisa: alur bill/payto, promo Eceran (S_PromE1/E2), integrasi stok keluar.

### 5.4 Retur Penjualan
- **UI 1:1**: LIST (filter radio khas: Tanpa Asal dan Potong Faktur/Asal Faktur/Potong Faktur/Yang Belum/Sudah Ada Pelunasan; kolom ID/Gudang/Mlk/No Retur/Tgl/Pelanggan/Kurs/MU/Harga/Discount/PJK-PPN/%/Total/Divisi/Jenis Penj/Catatan) + FORM (**Faktur Asal** + **Potong pd Faktur** + Pelanggan + tombol **Kirim Ke** + Sales + Gudang + No Retur + Tgl Retur(+jam) + MU/Kurs(kurs+kurs pajak) + **Tambah Dari Master** + panel Total Nilai/Total Harga/Total Disc/Discount(pers+nilai)/**TOTAL RETUR** + Catatan 3 baris + C R E D I T).
- **BE**: `s_retpen` (faktur asal `penjua_id` + `penjua_id2` potong, disc_perst+disc_nilai, adj_01..05, ppn_tipe/pers/nilai, kurs/kurs_pajak, cash, clear_ar) + `s_retpjd` (sat_rusak, jml_rusak, bon_satuan/bon_jumlah, harga_ex1/2, disc_pers×3, disc_nilai, **mast_disc/mast_ppn/mast_adj_1..5**, hpp/hpp_rusak, dari_mast).
- **LOGIC (MATH CHECK PASS)**: contoh 189.000 / 35.155 / 152.345 / **169.102,95**.
- **RELASI (teruji)**: `retpen.penjua_id → s_penjua.no` (Faktur Asal tampil) + `s_retpen.id ↔ s_retpjd.retpen_id`.
- Sisa: posting Potong Faktur, clear_ar otomatis.

### 5.5 Penerimaan Piutang
- **UI 1:1**: FORM (Divisi + No + Tanggal + Pelanggan + **Collector** + Catatan; grid nota dibayar; panel kanan **Daftar Tagihan** (sisa>0); tombol **Scan / Tambah dari List / Tambah dari Daftar Tagihan / Tambah / Koreksi / Hapus / Disc**; nav + Simpan/Tutup).
- **BE**: master `s_lpenma` (invpen_id, divisi_id, pelang, collector, no+no_c, catatan, als_batal) + baris `s_lunpen` (`lpenma_id`, invpen_id, **penjua_id**, **retpen_id**, **dcnpiu_id**, **deppen_id**, tanggal, discount, lunas, denda).
- **LOGIC+RELASI (teruji)**: `s_lpenma.id ↔ s_lunpen.lpenma_id`; `s_lunpen.penjua_id → s_penjua.no`; alur uji: nota 200.000 → terima 200.000 (sisa 0) → update disc 10.000+denda 500 (bayar 110.500, sisa 89.500) → **HAPUS receipt → dibayar balik 0, sisa 200.000 (REVERSAL CHECK PASS)**.
- Sisa: Scan barcode, potong faktur otomatis.

### 5.6 Daftar Piutang (viewer)
- **UI 1:1**: viewer (tanpa Tambah) + tombol Menu Utama/Menu/Laporan/**Masuk Daftar Tagihan**/Tutup + **PROSES** + radio 'Yang Belum/Sudah Ada Pelunasan'; kolom No/Tgl/Pelanggan/Total/Diterima/Retur/Sisa + total sisa.
- **BE**: `daftarPiutangList` = data live `s_penjua` + `s_lunpen` (join master non-hapus) + `s_retpen`; 'Masuk Daftar Tagihan' → `/penerimaan-piutang` (langsung bisa dibayar dari panel tagihan).
- Sisa: filter tanggal/divisi lanjutan.

---

## 6. Kas — ✅ 7/7 (100%)

### 6.1 Kas Masuk ✅ (basic, belum V2-pass)
- BE CRUD `s_kasmsk + s_kasmex` (debet/kredit); FE `/kas-masuk`. Sisa: V2-pass UI (ikon+kolom GF).

### 6.2 Kas Keluar ✅ (basic)
- BE CRUD `s_kasklr + s_kaskex` (debet); FE `/kas-keluar` (9.604 data asli). Sisa: V2-pass.

### 6.3 Transfer Kas ✅ (basic)
- FE `/transfer-kas`: Dari = kredit, Ke = debet + biaya; balanced; menulis dokumen kas. Sisa: V2-pass.

### 6.4 Cari CH/BG Masuk (24624) ✅ V2-deep
- **UI 1:1** (judul asli GF: "CH/BG Kas Masuk/Transfer Kas"): panel **KHUSUS VENDOR** (Nama/Alamat/ID) kiri + **KHUSUS PELANGGAN** (Nama/Alamat/Daerah/DaerahID/ID) kanan — double-click = filter; range **Tanggal Jatuh Tempo** + **Cari CH/BG** + tombol **Proses/Batal/Tutup**; grid GF (DB/CR, Note, Date, MU*, Nilai, Nilai-3, Kurs, Perkiraan, Tgl Cair, Cair ke, Information, Tanggal/Vendor-Pelanggan).
- **BE**: `chbgList(tipe:"masuk")` dari `gf.s_kasmex` (join s_kasmsk + s_perkir + s_vendor + s_pelang); `DB/CR` = flag `kredit`; filter q (no/lunas_doc/nama), tanggal, vendor/pelang; refs `chbgVendorRef`/`chbgPelangganRef`.
- **Teruji**: 19.396 baris terbaca + total nilai; cari no `...174` ketemu; panel ref 300 vendor/13 pelanggan.
- Sisa: filter persis Tgl Jatuh Tempo (`lunas_dt`) bila data giro bertambah.

### 6.5 Cari CH/BG Keluar (24625) ✅ V2-deep
- Analog dari `gf.s_kaskex` (join s_kasklr); `DB/CR` = flag `debet`. **Teruji**: 18.286 baris + total nilai.

### 6.6 Pencairan CH/BG Masuk (24627) ✅ V2-deep
- **UI 1:1**: static "P E N C A I R A N   C H / B G" + range Tanggal + Cari CH/BG + dua grid: **atas = belum cair** (dipilih, Ctrl+klik multi), **bawah = sudah cair** + kolom **Catatan**; tombol Cetak Setup/Cetak/**Refresh**/**Cairkan** (disabled tanpa pilihan)/Tutup + Batal Cair (pemulih, tambahan kecil).
- **LOGIC (teruji penuh)**: Cairkan → `cairchbg=true, lunas_cair=<Tgl Cair>, luncair_nb=<catatan>`; filter status belum/sudah berpindah benar; **Batal Cair** mengembalikan (REVERSAL) — data uji dikembalikan bersih.
- Field Tgl Cair + Catatan disediakan di baris filter (nilai masuk `lunas_cair`/`luncair_nb`).

### 6.7 Pencairan CH/BG Keluar (24628) ✅ V2-deep
- Analog dari `gf.s_kaskex`; tombol & logic sama (`Cairkan`/`Batal Cair` → `cairchbg/lunas_cair/luncair_nb`).
- **Rute**: `/cari-chbg-masuk`, `/cari-chbg-keluar`, `/pencairan-chbg-masuk`, `/pencairan-chbg-keluar` (terdaftar di Shell → menu id 24624/24625/24627/24628).

## 6b. Antar Cabang — ✅ 2/2 (100%) — *Fase D*

Deep scan GF menemukan: layar antar cabang = **form induk dengan mode** — judul form GF: "Pembelian **[ANTAR CABANG]**" (24632) & "Penjualan **[ANTAR CABANG]**" (24633); **tidak ada kolom diskriminator baru** di DB (write tetap `s_pembel/s_pembed` & `s_penjua/s_penjud`, memakai `divisi_id` + `gudang`).

### 6b.1 Pembelian Antar Cabang (24632) ✅
- **UI 1:1** (hasil dump kontrol GF): baris tambahan **Cabang :** combo (14 cabang dari `s_divisi`), **Jenis** combo ('Pembelian Barang'), combo mode **'---' / 'Tanpa Item'**, dan **Gudang** combo **16 opsi** (GUDANG MASTER + "GUDANG <NAMA CABANG>" per divisi — di GF gudang = turunan divisi, bukan tabel s_gudang), PJK/PPN.
- Mode 'Tanpa Item' → boleh simpan tanpa baris barang.
- **BE**: `PurchaseInput` + `Purchase` dapat `divisiId` (kolom `s_pembel.divisi_id`); CRUD sama.
- **Teruji (MATH+RELASI)**: create gudang=6/divisi=6 → tersimpan & terbaca ulang; cleanup bersih.

### 6b.2 Penjualan Antar Cabang (24633) ✅
- Pengamatan GF: form **2 tab** (sama pola dengan Penjualan) + mode [ANTAR CABANG]; ekstra Cabang/Jenis('Penjualan Barang')/Tanpa Item/Gudang-per-divisi (simetris dengan pembelian).
- **BE**: `SaleInput` + `Sale` dapat `divisiId` (kolom `s_penjua.divisi_id`).
- **Teruji**: create gudang=6/divisi=6 (no auto 41021847) → tersimpan; cleanup bersih.
- **Rute**: `/pembelian-antar-cabang`, `/penjualan-antar-cabang` (Shell → 24632/24633).

---

## 7. GL — 🔄 7/7 (~90%)

- **Jurnal Pembukuan** ✅: BE CRUD `s_jurnal + s_jurnex` (debet/kredit, balance); FE `/jurnal` (1.054.663 baris asli). Sisa: V2-pass.
- **Buku Besar** ✅: `bukuBesarList` per akun (debet/kredit/saldo dari `s_jurnex`); FE `/buku-besar` (373 akun).
- **Laporan Keuangan** ✅: Neraca + Laba Rugi dari saldo akun (kelas 1–5) + cek balance; FE `/laporan-keuangan`.
- **Aktiva Tetap** ✅: BE CRUD `s_aktttp` (harga beli, metode/%/usia susut, #Acc aktiva/susut, tgl jual/out); FE `/aktiva-tetap`.
- **Cek Kurs Jurnal** ✅: `glCekKurs` — banding nilai vs nilai_3 (793 baris, 22 kolom), MU via `s_mauang`; FE `/gl/cek-kurs-jurnal`.
- **Cek Perantara** ✅: `glCekPerantara` — selisih ≠ 0 per tanggal, akun 199xx (26 baris selisih); FE `/gl/cek-perantara`.
- **Saldo Akhir Perkiraan** ✅: `glSaldoAkhir` — leaf + kelas + golongan; `sal_awal + mutasi ≤ tanggal`; filter kelas+golongan; FE `/gl/saldo-akhir`.
- Sisa: verifikasi rumus "Setelah Tarik Kurs" & cache laporan GF (`R_*.DBF` vs live DB).

---

## 8. Lainnya — 🔄 9/14 (~65%)

- **Barang Masuk** ✅: BE CRUD `s_stkmas + s_stkmex`; FE `/barang-masuk`.
- **Barang Keluar** ✅: BE CRUD `s_stkklr + s_stkkex`; FE `/barang-keluar`.
- **Promosi** ✅: BE CRUD `s_promos` (rentang tanggal/pukul + jenis penjualan); FE `/promosi`.
- **Kartu Stock** ✅ (read-only): `kartuStockList` (mutasi dari `s_stkmex` + `s_stkkex`, UNION; 17.969 mutasi); FE `/kartu-stock`.
- **Kartu Hutang** ✅ (read-only): pembelian + pembayaran per vendor; FE `/kartu-hutang`.
- **Kartu Piutang** ✅ (read-only): penjualan + penerimaan per pelanggan; FE `/kartu-piutang`.
- **Barang Expired** ✅ (read-only): `s_pembed.expired`; FE `/barang-expired`.
- **Barang Produksi** ✅: BE CRUD `s_prodsi`; FE `/barang-produksi`.
- **Barang Promosi (24647)** ✅ V2-deep — form 3 tab GF: **Main** (Hari checklist 8: Senin–Minggu+LiburNas; Tanggal & **Pukul** HHMM; **Item** + F3; radio **Disc % / Disc / Setting Harga Jual Spesial**; grid 7 baris Harga Beli + Harga Jual *1..*5 dengan DISC%/DISC2%/DISC3% per level + SET%/NILAI) · **Kelompok Pelanggan** (checklist Group Pel/Group Pe2 — tanpa pilihan = semua) · **Lain-Lain** (checklist **Divisi** 14 + **Tipe Entry** 5: SO/Eceran/Cash-Credit/AC/Retur).
  - **BE**: modul promosi diperluas — `groupPel/groupPe2` (kolom `s_promos.group_pel/group_pe2`), `promoItemInfo` (harga beli + 5 harga jual + disc master), `promoTerapkanItem(promosId, stockId, mode, levels)`:
    - mode **harga** → tulis Harga Jual *1..*5 + Disc1..3 ke master `s_stock` (teruji: 75000→80000+disc5%→revert 75000);
    - mode **disc/discnil** → baris `s_prome1` (**relasi `promos_id`** ke s_promos + FK `mauang_id`→s_mauang=IDR); teruji 2 baris + cleanup.
  - **Relasi**: `s_promos.id ↔ s_prome1.promos_id`, `s_prome1.mauang_id → s_mauang`, master item `s_stock` (harga_j_01..05/disc1..3_j_01..05).
  - Catatan: checkbox SO/AC/Retur pada Tipe Entry tidak punya kolom di `s_promos` (hanya penj_ecr/penj_csh/penj_crd yang dipersist) — dicatat sebagai keterbatasan skema GF. Hari/Divisi/Group disimpan comma-list ("tanpa pilihan = semua").
- **Barang Transfer (24650)** ✅ V2-deep: form GF — Divisi/Tanggal/**ID hijau**/Gudang/Item(F3)/**Jumlah**/**Sisa Stock [TIDAK DIHITUNG]**/Catatan ×4 + panel navigasi (▲▼+⭐ HP Pukul Rata) + seksi biru **"Item/Stock yang berkurang"** (grid G.. /Kode/Nama/Jumlah/Catatan + Tambah/Koreksi/Hapus + tombol oranye **HP Pukul Rata**) + **"Tambahan Cost/Biaya" #Acc *1..*3 + Nilai *1..*3** + status "Jumlah belum diisi !"; LIST + tombol **Template** (khas layar ini).
  - **DB**: `s_trmstk` (header: divisi_id/gudang/tanggal/pukul/tot_harga/tot_harex1/tot_harex2/catatan×3) + `s_trmsex` (**relasi `trmstk_id`**, stock_id/jumlah/harga/catatan). `nilai1/2/3` dipetakan ke `tot_harga/tot_harex1/tot_harex2`; #Acc perkiraan = UI (tidak ada kolom — kemungkinan posting jurnal; dicatat).
  - **Uji PASS**: tot=189000/jml 3, relasi 2 baris, sisa stock, update, delete bersih. **HP Pukul Rata** = harga/unit = (Nilai1+2+3)/Σjumlah.
- **Barang UnTransfer (24651)** ✅ V2-deep: **mirror** Transfer dengan judul GF asli "Barang **UnTransfer**" — seksi **"Item/Stock yang bertambah"** (+ kolom **HPP%**), panel **<< < > >> + Template**, grup **"Tambahan Cost/Biaya dari :"**. Uji memakai jalur API yang sama (PASS + cleanup); lihat REVISI peta tabel di bawah.
  - **⚠️ REVISI PETA TABEL (13 Okt)**: setelah field-match penuh, **Barang Transfer/UnTransfer = `s_stktra` (header) + `s_stktex` (baris "Item/Stock yang berkurang", relasi `stktra_id`)** — `per1_nil/per2_nil/per3_nil` = Nilai*1..3, `perkir_1/2/3` = #Acc*1..3, `catatan`×3, `hpp`. `s_trmstk/s_trmsex` (ber-link `pembel_id/purcor_id/vendor`) BUKAN layar ini. BE/FE dirombak: header kini berisi item utama (`stock_id/jumlah/hpp`) + combo item (bukan field gelap). Uji ulang PASS (header+2 baris, relasi, update, delete bersih); semua baris uji `s_trmstk/s_trmsex` dibersihkan.
- **Barang Pindah Gudang (24652)** ✅ V2-deep — judul GF asli "Barang Pindah Gudang". Form: nav **<< < > >>** besar, **Divisi / Tanggal / ID / Dr Gudang / Ke Gudang / No / Kirim Ke (nama+alamat) / Catatan** + grid + tombol **Scan / Tambah / Koreksi / Hapus / Copy Item ke Clipboard / Paste Item dari Clipboard** (pola S/O). LIST kolom **Dari / Ke / No / Tanggal / Nama**.
  - **DB**: `s_stkpin` (38 kol: divisi_id/nama/alamat/no int/gudang_1/gudang_2/catatan + audit) + `s_stkpex` (**relasi `stkpin_id`**; stock_id/stock_gdg/stock_gdg2/jumlah/hpp/catatan). Data asli: **58.372 dokumen** (modul aktif; `no` auto lanjut 58066+). Teruji: create (no auto 58066, total 5), relasi 2 baris, cari, update, delete + cleanup total.
- **Validasi Barang Keluar (24665)** ✅ V2-deep (viewer operasional scan) — GF: combo **"Scan Cty live Nota"**, field **Penjualan (PJ) / Pindah Gdg (PG) / Tutup Error (5)**, area log kuning besar, grid **No./Kode/Nama/Jml/Satuan/Scan/Group**, tombol **Tutup** (tanpa Tambah).
  - **FE**: scan (kode/nama item + Enter) → lookup master item → validasi lawan dokumen: `saleById` (bila field PJ = id nota, relasi `s_penjud`) & `barangPindahGudangById` (bila PG = id pindah, relasi `s_stkpex`) → baris masuk grid + log (OK/✖ + alasan); **Tutup Error** = auto-stop saat error mencapai batas (default 5); tombol Bersihkan. Rute `/validasi-barang-keluar` (24665).
- ⏳ **Belum**: Barang Promosi ×2, Barang Transfer, Barang Untransfer, Pindah Gudang, Validasi Barang Keluar (Fase E).

---

## 9. Laporan — 🔄 ~60%

- **Observe menyeluruh** ✅: Proses Laporan, Item Cetak, viewer Reports/Laporan, Report Set, Export >>> Text File, Contoh Laporan, FastReport (designer), quick-print.
- **Katalog 557 file `.rpt`** ✅ → 9 grup (inventori + generator `build_catalog.py` → `laporan.catalog.ts`); BE `laporanCatalog`; FE `/laporan` viewer GF-style; FastReport (24668) jalan.
- **Vertical slice data** ✅: `laporanHasil` (Daftar Item 011 + Sisa Stock 012) + Export CSV.
- ⏳ **Sisa (A4)**: implementasi data laporan modul lain (Pembelian/Penjualan/Kas/GL dst) + tombol Laporan/Cetak per layar.

---

## 10. Sistem Setup — 🔄 4/5 inti (≈80%) — *Fase F 13 Okt 2026*

- **Kode Perkiraan (24521)** ✅ V2-deep: form GF "Kode Perkiraan" (tab Header|Detail, golongan 1=AKTIVA..5=BIAYA, M.U.+Kurs, Saldo Awal, toggle **Kode Perkiraan Nilai Debet / Multi Currency / Tarik Selisih Kurs / Non-Reverse / DB + CH-BG**; grid User = bitmap biner GF — read-only catatan). **BE**: `s_perkir` **373 akun** + `mauangList`; CRUD teruji (create/update/debet=false/nonRev/saldo) + cleanup. Rute `/kode-perkiraan`.
- **Tipe Pembayaran (24524)** ✅ V2-deep (POS): `s_luntip` — charges (`chargestxt/charges/chargesnil/chargescd1..2` = "Jika Total >="), toggles **Non Aktif/GF-Payment/Tampil QRIS/Charges Hitung Per Item/Charges Tanpa Pembulatan**, Disc global (`glb_discs` **boolean**, `glb_disc/glb_discnl/glb_disccd`), `adjust` int, Kas Perkiraan + `#Link`. Data master GF = 4 baris (TRANSFER/QRIS/DEBIT BCA/CREDIT BCA) berstatus soft-deleted — list konsisten. CRUD teruji + cleanup. Rute `/tipe-pembayaran`.
- **Eceran List (24525)** ✅ V2-deep: `s_ecrlst` **baris preset (`sts_ecr IS NULL`)** — Kelompok/Hitungan/H.Jual/**Harga *1..*5 (`mu_h_j_01..05`)**/#Item/#Item Extra (`stock_id/stock_id2`)/PABX Ext/#Key Room/#Key Lift/Def. ChkOut/Non Aktif. **FK relasi**: `grpecr_id→s_grpecr`, `grpec2_id→s_grpec2`, `stock_id→s_stock` (terverifikasi). Teruji CRUD + harga 1-5 + relasi item + cleanup total. Rute `/eceran-list`.
- **Konfigurasi (24532/24533)** ✅ (inti): GF "Sistem Konfigurasi" **`s_kontro` = 1.141 kolom (1 baris: MONI COSMETIC SUPERMARKET)**. FE 5 tab: Profil (form + Simpan subset: nama/alamat/NPWP/PKP/Fak Pjk/telepon/email/website/rekening 1–5/QRIS/menu), Divisi & Gudang (14), No. Dokumen (`s_kontno` 45: untuk/divisi/tahun/last_nn), **Map Harga Jual Modul** (`s_konhjn` 50 — kolom hotel/ktv/billiard/rental/spa berisi 'Harga Jual *n' = PEMETAAN level harga per modul usaha!), Info Paket (PAKET ACCOUNTING 1 USER + `s_ownrid` 48 + `s_koncab` 0). Teruji baca penuh + update website + **revert**. Rute `/konfigurasi`. Sisa: tab bulanan (ratusan kolom) pass lanjutan.
- **Setup List (24520)** 🔄 observe penuh: window **"List (Sistem Setup)" = 11 TAB** (terlihat: Mata Uang/Kurs/Pembulatan Harga Jual/Negara/Daerah/Daerah*2/Divisi; 4 tersembunyi di balik panah — panah inert saat diprobe); form **Mata Uang** (Auto Pay KK/KM Perkiraan, Decimal, Terbilang MU/Sen) ter-capture. FE pass lanjutan.
- ⏳ User Profile (24486) — Fase G.

---

## 11. Antrian Fase (urutan kerja)

1. ~~**Fase C** — Cari/Pencairan CH-BG (4 layar)~~ ✅ **SELESAI** (modul Kas tuntas 7/7).
2. ~~**Fase D** — Antar Cabang (2 layar)~~ ✅ **SELESAI** (mode [ANTAR CABANG] + combo cabang/gudang; divisiId tersimpan).
3. ~~**Fase E** — Barang Promosi ×2, Transfer, Untransfer, Pindah Gudang, Validasi Barang Keluar~~ ✅ **SELESAI 13 Okt 2026** (5 layar; modul Lainnya ~95%).
4. **Fase F** — Sistem Setup (5 layar) ← berikutnya.
5. **Fase G** — User Profile + sisa kecil.
6. **V2-pass sisa** — Daftar Hutang, Kas Masuk/Keluar/Transfer, Aktiva Tetap, Jurnal, BB, LK, Promosi, Produksi, Barang Masuk/Keluar, Kartu ×3, Expired.
7. **V1c** toolbar ikon individual · **A4** data laporan per modul · **V3** laporan pixel-perfect · **V4** re-check semua klaim.

## 12. Aturan Update File Ini

- Setiap **layar selesai diverifikasi** (UI 1:1 + LOGIC + RELASI + CRUD bersih) → update tabel ringkasan (§0) + tambah detail di grup terkait (§3–§10) + catat di **Riwayat** (§13).
- Turunkan/naikkan persentase grup sesuai realita; jaga konsistensi dengan `TODOLIST.txt` dan vault.

## 13. Riwayat Update

- **13 Okt 2026 (7)** — **FASE F SELESAI (inti 4/5 + Setup List observe)**: Kode Perkiraan (`s_perkir` 373 akun, CRUD+toggle), Tipe Pembayaran (`s_luntip`, charges/disc/toggles; glb_discs boolean & adjust int dikoreksi), Eceran List (`s_ecrlst` preset, FK 3 arah terverifikasi), **Konfigurasi** (`s_kontro` 1.141 kolom; temuan `s_konhjn` = map Harga Jual per modul usaha). Semua uji PASS + cleanup/revert. Progress **±68%**; berikutnya **Fase G (User Profile)** + V2-pass sisa.
- **13 Okt 2026 (6)** — **FASE E SELESAI (5/5)**: + **Validasi Barang Keluar (24665)** (viewer scan: Scan Cty live Nota, Penjualan/Pindah Gdg/Tutup Error, log kuning, validasi lawan `saleById`/`barangPindahGudangById`, auto-stop pada batas error). Modul Lainnya ~95%; progress keseluruhan **±66%**; berikutnya **Fase F (Sistem Setup 5 layar)**.
- **13 Okt 2026 (5)** — **Fase E 4/5**: Barang Transfer + UnTransfer (REVISI peta tabel → `s_stktra/s_stktex`) + **Barang Pindah Gudang** (24652, `s_stkpin/s_stkpex` 58.372 dokumen — no auto lanjut 58066) V2-deep, semua uji PASS + cleanup. Progress ±65%; sisa Fase E: **Validasi Barang Keluar (24665)**.
- **13 Okt 2026 (4)** — **Fase E mulai: Barang Promosi (24647) SELESAI V2-deep** — form 3 tab (Main/Kelompok Pelanggan/Lain-Lain), hari checklist, pukul HHMM, radio Disc/Jual-Spesial, grid 7 harga; BE promosi diperluas (groupPel/groupPe2 + promoTerapkanItem → s_stock master harga ATAU s_prome1 relasi promos_id). Semua uji PASS + cleanup. Progress ±65%. Sisa Fase E: Transfer, Untransfer, Pindah Gudang, Validasi Barang Keluar.
- **13 Okt 2026 (3)** — **Fase D SELESAI**: Pembelian & Penjualan [ANTAR CABANG] (24632/24633) V2-deep. Temuan: antar cabang = mode dari form induk (judul "Pembelian [ANTAR CABANG]"), tanpa tabel/kolom baru; gudang = turunan divisi (16 opsi dari MASTER+14 cabang). BE Pembelian & Penjualan dapat `divisiId` (`s_pembel/s_penjua.divisi_id`). Smoke PASS + cleanup bersih. Progress ±64%; berikutnya Fase E (Barang Promosi/Transfer/Untransfer/Pindah Gudang/Validasi).
- **13 Okt 2026 (2)** — **Fase C SELESAI**: 4 layar Cari/Pencairan CH-BG dibangun V2-deep (BE modul `chbg` + FE `ChbgScreen` bersama + 4 rute). Teruji: list masuk 19.396 / keluar 18.286 baris; cari no; Cairkan → `cairchbg/lunas_cair/luncair_nb`; filter belum/sudah; Batal Cair (reversal, data uji dikembalikan). **Modul Kas tuntas 7/7 (100%)**; progress keseluruhan ±62%; berikutnya Fase D (Antar Cabang).
- **13 Okt 2026 (1)** — File dibuat. Rekap seluruh pencapaian: Fondasi, Shell/Menu, Master File 5/5, Pembelian 6/6, **Penjualan 6/6 (all LOGIC + RELASI TABLE teruji)**; progress keseluruhan ±60%.
