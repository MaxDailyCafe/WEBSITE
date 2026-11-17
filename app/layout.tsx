import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, Tajawal } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/brand/GrainOverlay";

const montserrat = localFont({
  src: "./fonts/Montserrat.ttf",
  variable: "--font-montserrat",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAX DAILY — Specialty Coffee & Artisan Bakery Menu",
  description: "A Daily Dose of Positivity since 2015. Luxury Editorial Menu & Interactive 3D Studio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F5EFE2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorant.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased selection:bg-[#D9AE7B]/40 selection:text-[#1A120D]">
        <GrainOverlay />
        {children}
      </body>
    </html>
  );
}
