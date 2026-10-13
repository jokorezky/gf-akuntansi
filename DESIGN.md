# DESIGN.md — token visual GF Clone

Sumber kebenaran tampilan untuk **semua** FE clone. Diambil dari aplikasi GF Akuntansi
yang berjalan (build 951.1823 / 2026.06.28) via `tools/gf-observe/sample_colors.py`
dan `gf-menuutama.png`. Tujuan: **meniru tampilan GF** (keputusan user), bukan gaya baru.

## 1. Warna (sampel dari GF)

| Token | Nilai | Pemakaian | Bukti |
|---|---|---|---|
| `--gf-bg` | `#ABACAB` | Latar kerja aplikasi (di belakang jendela) | dominan 15,6% |
| `--gf-panel` | `#FBFBFB` | Muka panel / tombol ikon / kartu | sample group_label |
| `--gf-titlebar` | `#AFD8F7` | Title bar jendela anak MDI ("Menu Utama", form) | sample panel_header |
| `--gf-titlebar-text` | `#000000` | Teks judul jendela | sample |
| `--gf-border` | `#808080` | Garis kotak tombol / pemisah | turunan |
| `--gf-border-light` | `#FFFFFF` | Highlight tepi atas-kiri (efek 3D) | turunan |
| `--gf-text` | `#000000` | Teks utama | sample |
| `--gf-text-muted` | `#4A4A4A` | Label sekunder | turunan |
| `--gf-accent` | `#520009` | Merah marun (logo/aksen) | 0,8% |
| `--gf-accent-soft` | `#7B1113` | Variasi marun | turunan |
| `--gf-menubar-bg` | `#F3F3F3` | Baris menu atas + toolbar | titlebar sample |
| `--gf-infobox-a` | `#EAF7D6` | Gradien kotak info (atas) | gambar |
| `--gf-infobox-b` | `#D6EFB0` | Gradien kotak info (bawah) | gambar |
| `--gf-cashier-green` | `#1A7F37` | Angka ambil/kembalian di kasir | ditetapkan manual |

Aturan: teks vs latar ≥ 4,5:1. Teks hitam di atas `--gf-panel`/`--gf-bg` lolos.

## 2. Tipografi

GF memakai font bitmap klasik (MS Sans Serif/Tahoma 8pt) dengan **angka tabular**.
Untuk web, tiru kerapatannya:

| Token | Nilai |
|---|---|
| `--font-ui` | `Tahoma, "Segoe UI", system-ui, sans-serif` |
| `--font-mono` | `"Consolas", "Cascadia Mono", monospace` (angka/uang) |
| Ukuran label | 12px (padat, seperti GF) |
| Ukuran judul jendela | 13px bold |
| Ukuran teks grid/tabel | 12px |
| Angka uang | rata kanan, `--font-mono`, tabular-nums |

## 3. Kerangka layar (meniru GF)

```
┌─────────────────────────────────────────────────────────────┐
│ Menu bar: Aplikasi Sistem Setup Master File Pembelian ... Help │  --gf-menubar-bg
├─────────────────────────────────────────────────────────────┤
│ Toolbar ikon (printer, kalkulator, f(x), ...)                  │
├─────────────────────────────────────────────────────────────┤
│ ┌── Menu Utama ──────────────────────────────[ _ ▢ ✕ ]────┐  │  --gf-titlebar
│ │            MONI COSMETIC SUPERMARKET                    │  │
│ │  ┌────┐ ┌────┐ ┌────┐                                    │  │  grid 3 kolom
│ │  │ikon│ │ikon│ │ikon│   (tombol ikon, label di bawah)      │  │
│ │  └────┘ └────┘ └────┘                                    │  │
│ │  ... 12 tombol: Aplikasi, Sistem Setup, Master File,     │  │
│ │      Pembelian, Penjualan, Antar Cabang, Kas, GL,        │  │
│ │      Lainnya, Bantuan, Log Off, Exit                     │  │
│ │                                    ┌─ kotak info GF ─┐    │  │
│ │                                    │ Nama/User/Date  │    │  │  gradien hijau
│ │                                    └─────────────────┘    │  │
│ └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Status bar: [tanggal] [jam]                                    │
└─────────────────────────────────────────────────────────────┘
```

- **Menu bar atas** persis urutan GF: `Aplikasi, Sistem Setup, Master File, Pembelian,
  Penjualan, Kas, Antar Cabang, GL, Lainnya, Help`.
- **Menu Utama** = grid tombol ikon **3 kolom** (urutan tombol GF: Antar Cabang sebelum Kas).
  Klik tombol mengganti isi kotak; tombol `Menu Utama (ESC)` kembali.
- **Kotak info** (kanan bawah panel): `Nama`, `User Login`, `System Date`, `Proteksi`,
  `Tutup Hari`, `Tutup Buku` — gradien hijau, sudut membulat.

## 4. Komponen

| Komponen | Spesifikasi |
|---|---|
| `IconMenuButton` | kotak 124×146 (rasio GF), border 1px `--gf-border`, muka `--gf-panel`, ikon di tengah, label 12px di bawah, state hover tertekan (border inset). |
| `MenuBar` | teks 12px, item hover berlatar highlight klasik `#316AC5`/teks putih. |
| `MdiWindow` | title bar `--gf-titlebar`, judul bold 13px, tombol minimize/maximize/close kanan. |
| `DataGrid` | header abu, baris 18–20px, zebra opsional, angka rata kanan mono. Daftar **langsung berisi** (bukan kosong sampai dicari — perbaikan GF). |
| `FormField` | label kiri, input kanan, urutan tab = urutan GF; wajib ditandai. Uang = decimal. |
| `ConfirmDialog` | pola GF sebelum simpan; `OtorisasiDialog` untuk user kedua. |
| `ReportViewer` | panel parameter, baris kelompok + total, drill-down, cetak A4 & struk, ekspor CSV/Excel/PDF. |
| `InfoBox` | gradien hijau, 6 baris info konteks. |
| `StatusBar` | tanggal + jam kanan. |
| `TrialBanner` | spanduk uji coba + tombol "Catat temuan". |

## 5. Interaksi & keyboard

- Hotkey mengikuti GF: `F2` Pelanggan, `F4` Item, `F5` Pembelian, `F7` Penjualan Eceran,
  `F8` Penjualan, `Ctrl+M` Kas Masuk, `Ctrl+K` Kas Keluar, `Ctrl+H` Pembayaran Hutang,
  `Ctrl+P` Penerimaan Piutang, `Ctrl+F5` Daftar Hutang, `Ctrl+F7` Sales Order,
  `Ctrl+F8` Daftar Piutang, `Ctrl+S` Kartu Stock, `Ctrl+E` Kartu Hutang, `Ctrl+U` Kartu Piutang.
- Di web, tombol yang bentrok browser (`F5`, `Ctrl+P`, `Ctrl+S`) dipetakan ulang + tetap disediakan; dicatat di spec tiap layar.

## 6. Larangan (anti-slop visual)

- Bukan gaya "startup modern"; ini meniru desktop GF: padat, border tegas, sudut tajam.
- Jangan pakai emoji sebagai ikon. Ikon = aset SVG/PNG.
- Kontras ≥ 4,5:1; fokus terlihat; hormati `prefers-reduced-motion`.
