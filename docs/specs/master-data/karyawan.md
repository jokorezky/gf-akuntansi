# Functional Spec — Master File › Karyawan

- **Modul**: Master File · **Fase**: P2 (vertical slice) · **Padanan GF**: menu id `24553`
- **Sumber observasi**: `tools/gf-observe/screens/karyawan-list.json`, `karyawan-form.json`
- **Tabel**: `gf.s_karyaw` (32 kolom) · **Status**: implementasi (CRUD)

## 1. Layar daftar (List)
- Grid kolom: **ID · Nama · Alamat · Tipe · Komisi · Telepon · Non-Aktif · Catatan**.
- Tombol: **Tambah** (Create), **Koreksi** (Update), **Hapus** (soft delete), **Tutup**.
- Perilaku: daftar **langsung berisi** (perbaikan GF), cari/filter, pagination server-side.

## 2. Form entri (Create / Edit)
Tab: **Data Utama** | **Inisialisasi**. Kontrol (dari dump GF):

| Label | Kontrol | Kolom `s_karyaw` | Wajib | Aturan |
|---|---|---|---|---|
| ID : | Edit (auto) | `id` | auto | otomatis, tak diketik |
| Nama : | Edit | `nama` (varchar 30) | **Ya** | tidak boleh kosong |
| Alamat : | Edit (multiline) | `alamat` (varchar 100) | — | |
| Telepon : | Edit | `telepon` (varchar 50) | — | |
| Komisi : | Edit (numeric) | `komisi` (numeric) | — | persen, desimal |
| Catatan : | Edit | `catatan` (varchar 30) | — | |
| Non-Aktif : | Edit (tanggal) | `non_aktif` (date) | — | dd/mm/yyyy |
| Jenis Penj : | ComboBox | `jenpen_id` (FK `s_jenpen`) | — | dropdown |
| Divisi : | ComboBox | `divisi_id` (FK `s_divisi`) | — | dropdown |
| Sales / Supir / Helper / Collector / Admin | Checkbox | `sales/supir/helper/collector/admin` (bool) | — | |
| (tombol) | Simpan, Tutup | — | — | Simpan = create/update |

**Create**: form kosong (kecuali ID auto) → **wajib isi Nama** → Simpan (INSERT).
**Edit (Koreksi)**: muat nilai lama ke **semua** input → ubah → Simpan (UPDATE).
**Hapus**: soft delete + konfirmasi.

## 3. Aturan bisnis & audit
- Wajib: `nama` tidak kosong (FE zod + BE validasi).
- Audit: create → `input_oleh`,`tgl_input`,`jam_input`; update → `ubah_oleh`,`tgl_ubah`,`jam_ubah`; hapus → `hapus_oleh`,`tgl_hapus`,`jam_hapus` (soft delete).
- List default = baris dengan `hapus_oleh` null.
- Simpan = **1 transaksi**.

## 4. Kontrak GraphQL (code-first)
```graphql
type Karyawan { id: Int! nama: String! alamat: String telepon: String komisi: Decimal catatan: String
  nonAktif: Date sales: Boolean supir: Boolean helper: Boolean collector: Boolean admin: Boolean
  jenpenId: Int divisiId: Int }
type KaryawanPage { rows: [Karyawan!]! total: Int! }
type JenpenRef { id: Int! nama: String! }
type DivisiRef { id: Int! nama: String! }

query  karyawanList(limit:Int=50, offset:Int=0, q:String): KaryawanPage!
query  karyawanById(id:Int!): Karyawan
query  jenpenRefList: [JenpenRef!]!
query  divisiRefList: [DivisiRef!]!

mutation createKaryawan(input: KaryawanInput!): Karyawan!
mutation updateKaryawan(id:Int!, input: KaryawanInput!): Karyawan!
mutation deleteKaryawan(id:Int!): Boolean!     # soft delete
```
`KaryawanInput` = field yang boleh diisi (nama wajib). Uang/qty = scalar `Decimal` (pg numeric).

## 5. Trace aturan
- Master data: rule `VALID-MD`/`STATE-MD` (INDUSIA). Layar ini tidak menghitung jurnal.
- Perbaikan GF: daftar langsung berisi (bukan kosong sampai dicari).

## 6. Pertanyaan terbuka
- `jenpen_id` (Jenis Penjualan) — apakah wajib untuk karyawan bertipe Sales? (cek GF)
- Tab "Inisialisasi" isinya apa? (belum diobservasi)

## V2 Deep 1:1 (observasi 2026-10-13, deep_explore + PrintWindow)
- List GF: header `MASTER FILE - KARYAWAN`; toolbar 4 tombol IKON (Insert/Koreksi/Hapus/Tutup, Koreksi+Hapus disabled saat tak ada seleksi); kolom: ID | Nama | Alamat | Tipe | Komisi | Telepon | Non-Aktif | Catatan.
- Form GF: 2 TAB ber-ikon -> `Data Utama` (ID hijau, Nama, Alamat multiline, Telepon, Komisi %, Catatan, Non-Aktif, Jenis Penj, Divisi, panel kanan checkbox Sales/Supir/Helper/Collector/Admin) & `Inisialisasi` (hint hijau "Tidak dipilih, berarti semuanya boleh." + 3 kolom checkbox Grouping / Grouping *2 / Grouping *3; di GF list 2 & 3 kosong karena tabel `gf.s_grpst2/s_grpst3` kosong).
- Tombol Simpan & Tutup ber-ikon. Simpan = full-document update (semua field dikirim).
- Clone: `/master/karyawan` dirombak 1:1 (ikon asli `/gf-icons/screens/karyawan/*`; tab, checkbox jabatan, 3 list grouping dari `grpstkRefList/grpst2RefList/grpst3RefList`); BE: field `grpstk/grpst2/grpst3` + referensi baru. CRUD teruji create->update->softdelete->cleanup.
- Temuan teknis crop: PrintWindow merender konten 1x di canvas skala fisik -> crop ikon dilakukan dengan koordinat terkalibrasi visual (lihat tools/gf-observe).
