# Functional Spec — Layar: Menu Utama (Shell)

- **Modul**: Shell / kerangka aplikasi (Fase P1)
- **Rute web**: `/` (beranda)
- **Padanan GF**: jendela MDI "Menu Utama" + menu bar atas + toolbar + kotak info + status bar
- **Sumber observasi**: `tools/gf-observe/native_menu.json`, `gf-menuutama.png`, `_live_menu.png`
- **Status**: draf implementasi P1

## 1. Tujuan layar
Pintu masuk aplikasi: menampilkan menu sesuai GF dan memberi jalan ke setiap modul.
Meniru **alur, urutan menu, dan urutan isian** GF; tampilan mengikuti `DESIGN.md` (token dari GF).

## 2. Elemen layar
| Elemen | Isi | Catatan |
|---|---|---|
| Menu bar atas | 10 grup: Aplikasi, Sistem Setup, Master File, Pembelian, Penjualan, Kas, Antar Cabang, GL, Lainnya, Help | Urutan = GF. Klik → dropdown butir. Butir destruktif dinonaktifkan. |
| Toolbar | Ikon toolbar (potongan asli GF) | Placeholder; fungsi menyusul. |
| Jendela "Menu Utama" | Judul + tombol minimize/maximize/close | Mirip jendela anak MDI GF. |
| Kisi tombol ikon | **3 kolom × 4 baris = 12 tombol** | Urutan GF: Aplikasi, Sistem Setup, Master File, Pembelian, Penjualan, **Antar Cabang, Kas**, GL, Lainnya, Bantuan, Log Off, Exit. Ikon = potongan asli GF. |
| Kotak info | Nama, User Login, System Date, Proteksi, Tutup Hari, Tutup Buku | Gradien hijau; sumber data = konfigurasi/DB (placeholder di P1). |
| Status bar | tanggal + jam (live) + pesan aksi | — |

## 3. Perilaku (meniru GF)
1. Klik tombol grup → isi jendela berganti menampilkan butir grup itu (padanan submenu GF).
2. Tombol **"Menu Utama (ESC)"** mengembalikan ke kisi utama.
3. Klik butir menu (menu bar atau butir grup) → untuk P1 hanya menampilkan pesan di status bar ("belum diimplementasikan"); nanti membuka layar terkait.
4. **Butir dinonaktifkan** (tidak dieksekusi): Create Indexes, Repair/Check Databases, Hapus Cache/File, Backup/Restore, Export/Import Data, POS Export/Import, Buat Jurnal Khusus, Set Proteksi Data, HPP Testing, Tutup Hari, Reset Tutup Hari, Proses Hitung Point, Tutup Tahun, Hapus Data, Exit, Export Penjualan ke Web, Proses Laporan Total, Check/Download Update, Delete Background. (Di GF: aditif/berat; menyamai aturan aman proyek.)
5. Hotkey ditampilkan pada butir (mis. Pelanggan `F2`, Item `F4`, Pembelian `F5`). Pemetaan penuh ada di `apps/web/src/lib/gf-menu.ts`.

## 4. Perubahan yang disengaja dari GF
- **Daftar langsung berisi** (bukan kosong sampai dicari) — perbaikan perilaku GF yang dikenal bermasalah (keputusan owner di `gf-akunting-web`).
- **Tampilan baru** yang meniru GF dengan token `DESIGN.md` (bukan piksel identik); ikon & toolbar memakai aset asli GF agar dekat.

## 5. Trace aturan
- Layar ini **navigasi murni**; tidak menghitung angka → tidak mengikat rule `CALC-/JRNL-/VALID-`.
- Hak akses menu (siapa boleh lihat grup apa) → rule `SEC-…` (menyusul saat backend/otentikasi).

## 6. Pertanyaan terbuka
- Arti label `Eceran` pada kotak info GF (belum jelas).
- Apakah `Tutup Tahun Pembukuan` memang nonaktif sampai tanggal tertentu (temuan sesi GAW-2).
- Perusahaan yang dipakai untuk nama di kotak info (placeholder `NAMA PERUSAHAAN`).

## 7. Bukti visual
- `docs/design/shot-menuutama.png` (hasil clone) vs `tools/gf-observe/gf-menuutama.png` (GF).
