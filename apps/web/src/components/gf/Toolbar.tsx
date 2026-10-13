import Image from "next/image";

export function Toolbar() {
  return (
    <div className="border-b border-gf-border bg-gf-menubar">
      {/* toolbar asli GF (dipotong dari aplikasi yang berjalan) */}
      <Image
        src="/gf-icons/_toolbar.png"
        alt="Toolbar GF"
        width={585}
        height={39}
        className="block"
        priority
      />
    </div>
  );
}
