export function Toolbar() {
  /* Catatan F3-P: strip ikon GF dipertahankan sementara (posisi persis);
     V1c mengganti tiap ikon ke lucide + fungsi setelah inventaris aksi diverifikasi di GF live. */
  return (
    <div className="border-b border-gf-border bg-white px-2 py-[3px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/gf-icons/_toolbar.png"
        alt="Toolbar GF"
        width={585}
        height={39}
        className="block rounded-md opacity-95"
      />
    </div>
  );
}
