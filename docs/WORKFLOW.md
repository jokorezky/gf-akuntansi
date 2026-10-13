# WORKFLOW.md — metode kerja per layar

Tujuan: membangun FE clone yang **meniru GF** sambil **mendokumentasikan** tiap layar.

## Loop: Observe → Spec → Code → Proof

1. **Observe** (baca GF yang berjalan)
   - Menu: `WM_COMMAND id` (native menu) — semua ID & hotkey di `tools/gf-observe/native_menu.json`.
   - Layar: screenshot (`windows-mcp`/PrintWindow) + dump kontrol Win32 (`wintree`) → `tools/gf-observe/screens/<slug>.json`.
   - Isi layar: FlaUI/UIA diuji terbatas untuk jendela kustom VO → pakai Win32 + gambar.
2. **Spec** — tulis `docs/specs/<modul>/<layar>.md`:
   - Tujuan layar, field (nama/tipe/wajib/default/validasi), tombol & hotkey,
   - Alur simpan/batal/cetak, aturan bisnis + **trace ke rule ID** (`CALC-/JRNL-/VALID-`) dari repositori ekstraksi (INDUSIA).
3. **Code** — komponen FE di `apps/web` meniru visual GF (`DESIGN.md`). Satu layar = satu PR-logis.
4. **Proof**
   - Visual: bandingkan screenshot clone vs GF (tata letak/urutan field).
   - Logika (fase BE): bandingkan angka dengan data perusahaan (rule replay), bukan "sekedar jalan".

## Konvensi
- Uang & jumlah = **decimal**, bukan `number` JS.
- Daftar **langsung berisi** (perbaikan perilaku GF yang kosong sampai dicari).
- Tidak meniru bug GF; bila GF vs spec berbeda, **spec menang** (dicatat di spec layar).
- Tidak ada rahasia (token/kunci) di repo/vault.

## ATURAN WAJIB — Observe MENYELURUH (berlaku semua layar)
> Instruksi user (2026-10-13): setiap layar **wajib diklik SEMUA tombol & tab**-nya — di daftar maupun di form —
> untuk menemukan **UI lain yang muncul** (tab, dialog, lookup, sub-form), lalu **semuanya dibuat (CRUD)**.

Langkah baku per layar:
1. Buka layar (list). **Klik tiap tombol** di toolbar list (Tambah/Koreksi/Hapus/Laporan/Kelompok/Menu/Z-A/…):
   catat UI baru yang muncul.
2. Buka form (Tambah). **Klik tiap tombol** di form; **pindah tiap tab** (SysTabControl32); klik tombol lookup
   di samping field; catat tiap dialog/tab baru + kontrolnya.
3. **Bloklist aman** (jangan klik): Simpan (kecuali untuk uji validasi), Hapus/Delete, Exit, Log Off,
   Create Indexes, Repair/Check DB, Tutup Hari/Tahun, Import/Export, Backup/Restore.
4. Hasil tiap UI baru → `tools/gf-observe/explore/<slug>.json` + screenshot.
5. **Semua field/tabel yang ditemukan wajib masuk FE + BE CRUD** (create/read/update/softDelete).
6. Catat temuan di spec layar (`docs/specs/...`): daftar tab, dialog, lookup, dan field tambahan.

Cara menjalankan: `python tools/gf-observe/explore_all.py <menu_id> <slug>`.

## Struktur artefak
```
tools/gf-observe/    harness + hasil sweep (native_menu.json, screens/*.json, *.png)
docs/specs/          functional spec per layar
docs/design/         DESIGN.md, mockup, brainstorming
apps/web/            frontend Next.js
apps/api/            backend NestJS + GraphQL (menyusul)
```

## Catatan harness GF (temuan 2026-10-13)
- GF (VO 32-bit) **mengabaikan `WM_COMMAND` saat window tidak aktif** — fokuskan dulu
  (`ShowWindow` + `SetForegroundWindow`) sebelum kirim perintah menu.
- `SendMessageW` **memblokir** bila handler membuka dialog modal → pakai `PostMessage`
  untuk klik (`BM_CLICK`) dan `SendMessageTimeout(…, SMTO_ABORTIFHUNG, 8s)` untuk WM_COMMAND
  (utility: `tools/gf-observe/gf_nav.py` — perintah `open/windows/click/close/dump`).
- Static bergaya tombol (item menu list GF) tidak merespons `BM_CLICK` — klik via koordinat.
- Popup pengingat "tutup hari" dapat muncul kapan saja (hanya Edit teks, tutup via X/WM_CLOSE).
- UIA (windows-mcp) tidak melihat dialog custom VO; dump kontrol via Win32
  (`EnumChildWindows`) + pywinauto untuk teks tree/list/combobox lintas proses.
