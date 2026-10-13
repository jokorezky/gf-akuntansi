# Spec — GL: Cek Kurs Jurnal, Cek Perkiraan Perantara, Saldo Akhir Perkiraan

> Sumber: observasi GF build 951.1823 (2026-10-13), menu GL id 24639/24640/24641.
> Artefak: `tools/gf-observe/screens/gl-cek-kurs-jurnal.{png,json}`, `gl-cek-perantara.png`,
> `gl-saldo-akhir.{png,json}`, `gl-saldo-akhir-preview.{png,json}`.

## 1. Cek Kurs Jurnal (24639)

**GF**: header `MU :` (combo, terisi `IDR`) + `Tanggal :` rentang (dari–sampai) + `Kurs yang bisa diterima :`
rentang; tombol `&Proses`, `&Tutup`. Klik `Proses` → grid 793 baris:
`Tanggal | No | Catatan | MU | Debet | Kredit | Kurs | Debet-IDR | Kredit-IDR | Note | Date | Vendor | Pelanggan |
Jenis | ID | Entry By | Entry Date | Entry Time | Last-Edit By | Last-Edit Date | Last-Edit Time`
(angka format Indonesia; kurs `1,0000`; contoh baris: kredit `510.105,60` → kredit-IDR `510.106,00`).
**Fungsi**: menemukan baris jurnal yang nilai konversi (IDR) berbeda dari nilai asli (pembulatan/kurs).

**Clone** `glCekKurs(mu?, dari?, sampai?, limit, offset)`:
- Sumber `gf.s_jurnex d JOIN gf.s_jurnal j` where `round(d.nilai_3,2) <> round(d.nilai,2)` (selisih konversi),
  kolom: Tanggal `DD/MM/YYYY`, No, Catatan, MU, Debet/Kredit (nilai asli side), Kurs `nilai_3/nilai`,
  Debet-IDR/Kredit-IDR (`nilai_3` side). Filter MU + rentang tanggal. FE: form + tombol Proses + grid + Tutup.

## 2. Cek Perkiraan Perantara (24640)

**GF**: `Cek Perkiraan Perantara Tanggal :` rentang + `&Proses`/`&Tutup`. Hasil grid 26 baris:
`Tanggal | Debet-3 | Kredit-3 | Selisih-3` (contoh 14 Sep 2026: 1.334.155.714,00 / 1.334.155.717,00 / -3,00).
**Fungsi**: kontrol akun perantara (kode `199xx`) — total debet vs kredit per tanggal + selisih.

**Clone** `glCekPerantara(dari?, sampai?, limit, offset)`:
`gf.s_jurnex` untuk `perkir_id IN (SELECT id FROM gf.s_perkir WHERE kode LIKE '199%')`, group per `tanggal`:
Debet, Kredit, Selisih (= debet − kredit). FE: form tanggal + Proses + grid + Tutup.

## 3. Saldo Akhir Perkiraan (24641)

**GF**: `Periode :` rentang tanggal (default 01/10/2026–13/10/2026); combo 1 = kelas akun
(`AKTIVA, KEWAJIBAN, EKUITAS, PENDAPATAN, HARGA POKOK PENJUALAN, BIAYA/BEBAN, PENDAPATAN LAINNYA,
BIAYA/BEBAN LAINNYA`); combo 2 = golongan (`Golongan Kas/Bank, Golongan Piutang/Hutang, Golongan Aktiva Tetap,
Golongan Lainnya, ---`). Tombol `Cetak Set&up`, `&Cetak` → dialog `Preview?` (`Yes`=tampil layar) → FastReport
preview `Form Saldo Akhir Perkiraan.RP3`: header perusahaan, `Saldo Akhir Perkiraan Per : 13 Okt 2026`,
grid `NO | KODE | PERKIRAAN | MU | SALDO` (contoh: `1.1101 Kas Besar IDR … 79.794.535,00`).

**Clone** `glSaldoAkhir(kelas?, golongan?, sampai?, limit, offset)`:
- Sumber `gf.s_perkir p LEFT JOIN gf.s_jurnex d` — hanya akun leaf (`header = false`), saldo =
  `SUM(debet ? nilai : -nilai)` dengan `d.tanggal <= sampai` (kumulatif s/d tanggal, sesuai judul "Per :").
- Kelas → prefix kode: AKTIVA `1`, KEWAJIBAN `2`, EKUITAS `3`, PENDAPATAN `4`, HARGA POKOK PENJUALAN `5`,
  BIAYA/BEBAN `6`, PENDAPATAN LAINNYA `8`, BIAYA/BEBAN LAINNYA `9`.
- Golongan (kolom `s_perkir.golongan`): Kas/Bank `=1`, Piutang/Hutang `=8`, Aktiva Tetap `=7`,
  Lainnya `NOT IN (1,7,8)` (verifikasi detail menyusul).
- Kolom output: NO (urutan), KODE (format GF `1.1101` = digit pertama + `.` + sisa), PERKIRAAN, MU, SALDO (IDR).
  Kode ditampilkan dengan titik setelah digit pertama agar sama dengan GF.
- FE: form Periode + 2 combo + `Cetak Setup` (modal Report Set) + `Cetak` (window.print tabel) + `Tutup`.
  Data dimuat saat item difilter (change combo / Proses).

## 4. Catatan
- Semua layar bersifat **read-only** (tidak ada CRUD di GF; tombol diuji: Proses/Cetak/Preview/Tutup/Cetak Setup).
- Uang = string decimal berformat Inggris di BE; FE menampilkan apa adanya (formatting Indonesia menyusul bila perlu).
