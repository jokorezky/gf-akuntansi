"use client";

import { PeriodeScreen } from "@/components/gf/PeriodeScreen";

export default function Page() {
  return (
    <PeriodeScreen
      jenis="proteksi"
      judul="Set Proteksi Data"
      deskripsi="Menetapkan tanggal proteksi data (tgl_kunci) — data sebelum tanggal ini dianggap terkunci."
    />
  );
}
