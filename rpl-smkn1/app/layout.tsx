import type { Metadata } from "next";
import "./admin/admin.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rekayasa Perangkat Lunak | SMK Negeri 1 Bukit Sundi",
  description:
    "Kenali program Rekayasa Perangkat Lunak SMK Negeri 1 Bukit Sundi. Belajar pemrograman, desain UI/UX, dan pengembangan perangkat lunak melalui praktik dan proyek.",
  keywords: [
    "Rekayasa Perangkat Lunak",
    "RPL",
    "SMK Negeri 1 Bukit Sundi",
    "Bukit Sundi",
    "Sumatera Barat",
  ],
  openGraph: {
    title: "Rekayasa Perangkat Lunak | SMK Negeri 1 Bukit Sundi",
    description:
      "Unggul dalam kompetensi, kuat dalam karakter. Kenali program RPL SMK Negeri 1 Bukit Sundi.",
    locale: "id_ID",
    type: "website",
  },
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
