import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import "./globals.css";

const headingFont = Quicksand({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Websitenya Mpiw",
  description: "Tempat buat aku curahin isi hati aku ke kamu yang.",
  openGraph: {
    title: "Websitenya Mpiw",
    description: "Tempat buat aku curahin isi hati aku ke kamu yang.",
    url: "https://mpiw.com",
    siteName: "Websitenya Mpiw",
    images: [
      {
        url: "/og/mpiw.jpg",
        width: 600,
        height: 753,
        alt: "Preview image",
      },
    ],
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Websitenya Mpiw",
    description: "Tempat buat aku curahin isi hati aku ke kamu yang.",
    images: ["/og/mpiw.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
