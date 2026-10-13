import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
