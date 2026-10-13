# Spec — Modul Laporan (Reports / .rpt)

> Sumber: observasi langsung aplikasi GF (build 951.1823) pada 2026-10-13, menu
> `Lainnya > Fast Reports` (24668), tombol `&Laporan`/`&Cetak` di list Item (24558).
> Artefak observasi: `tools/gf-observe/screens/laporan-*.{png,json}`,
> `tools/gf-observe/rpt-inventory.json` (557 file `.rpt`), `tools/gf-observe/native_menu.json`.

## 1. Arsitektur laporan GF (temuan)

1. **Katalog**: 557 file template `*.rpt` / `*.rp3` di `D:\GF Akuntansi\ST_Rep2`
   (+ 76 template form cetak di `Template\Form`). Prefix nomor = modul:
   - `001/005` GL & perkiraan · `011-013` Item & Stock · `021` Vendor · `031-032` Pelanggan
   - `101-162` Pembelian · `201-291` Penjualan · `701-781` Lainnya · `801-883` Keuangan/GL
   - tanpa nomor (`Form *`) = template cetak dokumen.
2. **Engine**: FastReport (data dicache ke DBF `R_*.DBF`; template berisi field seperti
   `R_Item.Kode`, `R_Kontro.Atasnama`).
3. **Alur per list screen**:
   - Tombol `&Laporan` → dialog **"Proses Laporan"**: pilih *Kelompok Laporan* +
     *Periode* (radio: Tahun / Bulan ×2 / Tanggal / Custom; default Tanggal) →
     tombol `Proses` (generate cache: copy DBF + hitung transaksi + **HPP recalc**) →
     grid `Nama File | Keterangan` terisi → `Laporan` (enabled setelah proses tuntas) —
     tombol lain: `Batal`, `Tutup`. "Terakhir Proses" ditampilkan.
   - Tombol `&Cetak` → dialog filter **"<Modul> Cetak"** (Tanggal/ID/Input/Koreksi/
     Gudang/Vendor/MU + checkbox Pilih Per Item, Non-Aktif, konversi MU, Hitung Sisa
     Stock + picker grouping) → `Ok` → progress `Process (ID: n) no. x/N` →
     window **"Reports / Laporan"**.
4. **Viewer "Reports / Laporan"**:
   - Kiri: `PILIH KELOMPOK LAPORAN` (item bernomor 1-9, klik/hotkey) mis. untuk Item:
     `1. Daftar Item`, `2. Label Item`, `3. Laporan Sisa Stock`, `4. Laporan Nilai Stock`.
   - Kanan: `NAMA-NAMA LAPORAN` — per report 5 baris: (a) nama tampilan, (b) **nama file .rpt**,
     (c) folder temp `D:\Temp_GF\Rep_<prefix>\`, (d) folder sumber `ST_Rep2`, (e) flag `.T./.F.`.
   - Tombol: `Reporting` (designer), `Info` → preview contoh (**"Contoh Laporan"**:
     zoom ±, Ukuran Asli, Sesuai Ukuran, halaman ◀▶, Tutup, kanvas custom),
     `&Export >>> Text File` (pemilih field dual-list: Keterangan/Field/Value + panah +
     `Left Trim Data STRING`, `Clear Zero Decimal`, `Right Trim Data STRING`, SubStr,
     `&Export`/`&Tutup`), `Setup` (**"Report Set"**: Number Copies + Print To),
     `&Cetak` (buka template FastReport — designer/preview), `&Tutup`.
   - Quick-print `Lainnya > Fast Reports` (24668): list `Cetak` berisi `Laporan Pembelian`,
     `Laporan Penjualan`; tombol `Setup` (Report Set), `Cetak`, `Tutup`.

## 2. Desain clone (web)

Katalog lengkap 557 report dipetakan per modul (generator:
`tools/gf-observe/build_catalog.py` → `apps/api/src/modules/laporan/laporan.catalog.ts`).

**BE** `apps/api/src/modules/laporan`:
- `laporanCatalog` → `{ total, groups: [{ label, items: [{ kode, nama, file, kategori }] }] }`.
- `laporanHasil(kode, q?, limit?, offset?)` → `{ kode, judul, kolom: [String], baris: [[String]], total, catatan }`
  (bentuk generik tabel — meniru "Export Text File"/grid report).
  Report yang sudah diimplementasi (vertical slice):
  - file berawalan `011` (Daftar Item) → kolom: Kode, Kode2, Nama, Group, Satuan, H.Beli, H.Jual#1 (sumber `gf.s_stock`).
  - file `012 Laporan Sisa Stock*` → kolom: Group, Kode, Nama, Sisa, H.Jual#1, H.Jual#2.
  - lainnya → `catatan: "belum diimplementasikan"` + 1 baris info (katalog tetap lengkap).

**FE** `apps/web/src/app/laporan`:
- Layout meniru viewer GF: panel kiri `PILIH KELOMPOK LAPORAN` (bernomor, klik),
  panel kanan `NAMA-NAMA LAPORAN` (Nama | File | Kategori), bilah parameter
  (`Periode: Tanggal/Bulan/Tahun/Custom` disederhanakan + filter teks + `Proses`),
  grid hasil, tombol `Info` (modal), `Export >>> Text File` (unduh CSV),
  `Setup` (modal jumlah copy + printer — kosmetik), `Cetak` (window.print), `Tutup` (ke `/`).
- "Terakhir Proses" = waktu load terakhir.

## 3. Aturan

- Uang = decimal string; REUSE query existing (item/sisa-stock) agar konsisten.
- Laporan belum diimplementasi tetap tampil di katalog (dengan catatan) — implementasi menyusul per fase.
- Perilaku GF yang berat (HPP recalc) TIDAK direplikasi online; FE hanya meniru alur Proses→Hasil.
