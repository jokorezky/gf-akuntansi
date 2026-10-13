"use client";

import { PeriodeScreen } from "@/components/gf/PeriodeScreen";

export default function Page() {
  return (
    <PeriodeScreen
      jenis="tutup_hari"
      judul="Tutup Hari"
      deskripsi="Menetapkan tanggal tutup hari (cut-off transaksi). Gunakan Reset untuk mengosongkan kembali."
      bolehReset
    />
  );
}
