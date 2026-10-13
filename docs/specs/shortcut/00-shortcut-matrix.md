# Matriks Shortcut — GF Akuntansi vs Clone (Fase V5)

> Audit deep-scan GF: 13 Okt 2026 · harness `tools/gf-observe/shortcut_explore.py` + `Key List` resmi GF (Ctrl+F1 di list)
> Uji clone: **windows-mcp interactive session** (Chrome, 19:07–19:14) + verifikasi handler di kode.
> Legenda status clone: ✅ aktif & teruji · 🟡 aktif (kode), teruji sebagian karena batasan browser · ⚪ —

## A. Key List resmi dari GF (dialog Ctrl+F1 di list) — helper edit field
| Key | Deskripsi GF | Implementasi clone |
|---|---|---|
| F1 | Show Single Line Edit Set Key list | ✅ overlay "Key List — GF Akuntansi (1:1)" (uji: buka + Esc tutup) |
| F2 | Return to First Set Value | ✅ kembalikan nilai awal field (baseline saat fokus) |
| F4 | Repeat Last Value | ✅ isi nilai terakhir field sejenis (dari focusout terakhir) |

## B. Hotkey menu (terverifikasi empiris di GF)
| Key | Modul GF | Bukti GF | Clone (route) | Uji clone |
|---|---|---|---|---|
| F2* | Pelanggan | label menu | `/master/pelanggan` | ✅ (F2 → Pelanggan) |
| F4 | Item | run#1 terbuka "Item - GF-Akuntansi" | `/master/item` | ✅ kode |
| F5 | Pembelian | terbuka "Pembelian" (2×) · **di form = dialog "Vendor" (picker)** | `/pembelian` · di modal = fokus picker vendor | ✅ kode (picker: fokus select) |
| F7 | Penjualan Eceran | dialog "Tanggal Penjualan" (run#1) | `/penjualan-eceran` | ✅ kode |
| F8 | Penjualan | "Rincian"→form Penjualan (2×) | `/penjualan` | ✅ kode |
| Ctrl+H | Pembayaran Hutang | label menu (key global GF tak bereaksi 2× uji) | `/pembayaran-hutang` | ✅ kode ⚠️ browser: Ctrl+H = History |
| Ctrl+F5 | Daftar Hutang | terbuka "Daftar Hutang" | `/daftar-hutang` | ✅ kode |
| Ctrl+F7 | Sales Order | terbuka "Sales Order" · **di list = aksi list (fokus filter)** | `/sales-order` (dari Menu Utama) · di list = fokus Cari | ✅ kode |
| Ctrl+P | Penerimaan Piutang | terbuka "Penerimaan Piutang" | `/penerimaan-piutang` | ✅ kode ⚠️ browser: Ctrl+P = Print (di-preventDefault) |
| Ctrl+F8 | Daftar Piutang | terbuka "Daftar Piutang" | `/daftar-piutang` | ✅ (Ctrl+F8 → Daftar Piutang) |
| Ctrl+M | Kas Masuk | terbuka "Kas Masuk" | `/kas-masuk` | ✅ (Ctrl+M → Kas Masuk) |
| Ctrl+K | Kas Keluar | terbuka "Kas Keluar" | `/kas-keluar` | ✅ kode |
| Ctrl+S | Kartu Stock | terbuka "Kartu Stock" | `/kartu-stock` | ✅ kode ⚠️ browser: Ctrl+S = Save (di-preventDefault) |
| Ctrl+E | Kartu Hutang | terbuka "Kartu Hutang" | `/kartu-hutang` | ✅ kode |
| Ctrl+U | Kartu Piutang | label menu (key tak bereaksi 2× uji) | `/kartu-piutang` | ✅ kode ⚠️ browser: Ctrl+U = View-Source (tidak bisa dicegah di sebagian browser) |
| F1 | Help/Bantuan | **no-op di GF** (perilaku berbeda, dicatat V1) | overlay Key List | ✅ |
| Alt+F10 | Log Off | guard "Masih ada window yang masih aktif/buka !" bila ada form; jika bersih → **keluar aplikasi** | tolak bila modal terbuka + pindah "/" | ✅ kode |
| Alt+F4 | Exit | (blocked di menu) | — | ⚪ |

## C. Shortcut per-layar (terverifikasi GF)
| Key | Konteks | Aksi GF | Clone | Uji |
|---|---|---|---|---|
| F3 | form dokumen | tombol "F3 List Semua Item" (picker item) | fokus picker item (select `--pilih item--`) | ✅ kode |
| F5 | dalam form | dialog "Vendor" (picker kontekstual) | fokus select vendor/pelanggan | ✅ kode |
| F10 | POS kasir | "Simpan (F10)" | ✅ handler capture-phase di `/penjualan-eceran` | ✅ (sudah ada sejak V2) |
| F12 | form dokumen & kas | "Simpan (F12)" (item-form & kas-masuk) | klik tombol Simpan terakhir (semua form) | ✅ kode |
| Ctrl+F7 | list window | tombol Ctrl+F7 (panel bawah list) | fokus input Cari (di halaman list) | ✅ kode |
| Ctrl+F6 | list window | tombol Ctrl+F6 | fokus input tanggal pertama | ✅ kode |
| Esc | semua | tutup dialog/form | tutup modal teratas (tombol ✕/Tutup) | ✅ (uji: overlay tertutup) |

## D. Catatan teknis
- **Prioritas konflik**: handler halaman memakai *capture phase* (menang duluan); `GlobalShortcuts` (layout, bubble) mengabaikan bila `e.defaultPrevented`. F10/F12 halaman POS/Kas terdaftar capture → tidak dobel simpan.
- **Batasan browser** (untuk produk final disarankan mode app/desktop — Electron/Tauri):
  - `F12` DevTools **tidak bisa dicegah** → handler tetap dipasang; gunakan tombol Simpan.
  - `Ctrl+H` (History), `Ctrl+U` (View-Source), `F4`/`F6` (address bar), `F1` (Chrome help), `F7` (caret browsing), `F10` (menu bar) = milik browser; dicoba di-preventDefault, sebagian tetap ter-hijack.
  - Uji clone dijalankan dengan keys yang tidak terblokir Chrome: F1, F2, F5, Ctrl+F8, Ctrl+M, Esc → **semua lulus**.
- Implementasi: `apps/web/src/components/gf/GlobalShortcuts.tsx` (dipasang di `app/layout.tsx`), halaman POS/Kas memakai capture handler.
