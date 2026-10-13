import type { Metadata } from "next";
import { Toaster } from "sonner";
import { GlobalShortcuts } from "@/components/gf/GlobalShortcuts";
import { ConfirmHost } from "@/components/gf/ConfirmHost";
import "./globals.css";

export const metadata: Metadata = {
  title: "GF Akuntansi",
  description: "Rebuild GF Akuntansi (GFsoft) — web, TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <GlobalShortcuts />
        {children}
        <ConfirmHost />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
