"use client";

import { PeriodeScreen } from "@/components/gf/PeriodeScreen";

export default function Page() {
  return (
    <PeriodeScreen
      jenis="tutup_buku"
      judul="Tutup Tahun Pembukuan"
      deskripsi="Menetapkan tanggal tutup tahun pembukuan (gl_tutup). Proses posting saldo awal tahun berjalan menyusul di layar terkait."
    />
  );
}
