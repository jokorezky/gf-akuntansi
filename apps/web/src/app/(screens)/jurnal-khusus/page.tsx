"use client";

import { useRouter } from "next/navigation";
import { BookOpenCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();
  return (
    <div className="min-h-full p-3 text-gf-text">
      <div className="gf-window mx-auto max-w-[760px]">
        <div className="border-b border-gf-border bg-white px-3 py-[6px] text-[12.5px] font-semibold text-slate-800">
          Buat Jurnal Khusus (Jurnal Transaksi)
        </div>
        <div className="p-4">
          <div className="mb-3 text-center text-[12px] font-semibold tracking-[0.3em] text-gf-accent">
            BUAT JURNAL KHUSUS
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gf-border bg-slate-50 px-4 py-3 text-[12px] leading-relaxed text-slate-600">
            <span className="flex h-[40px] w-[40px] items-center justify-center rounded-xl bg-gf-accent/10 text-gf-accent">
              <BookOpenCheck className="h-[20px] w-[20px]" />
            </span>
            <p>
              Jurnal khusus/transaksi menggunakan layar <b>Jurnal Pembukuan</b> yang sama (jenis jurnal:
              Umum / Penerimaan / Pengeluaran / Penutup). Buka layar jurnal lalu pilih jenis yang diinginkan.
            </p>
          </div>
          <Button variant="primary" size="lg" className="mt-4" onClick={() => router.push("/jurnal")}>
            Buka Jurnal Pembukuan
            <ChevronRight className="h-[15px] w-[15px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
