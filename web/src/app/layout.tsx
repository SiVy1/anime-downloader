import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anime Downloader",
  description: "A Netflix-quality anime downloader",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-[#ededed] min-h-screen relative selection:bg-blue-500/30 font-sans tracking-tight`}
      >
        {/* Ambient Depth Layer */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(30,58,138,0.15)_0%,_transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 ambient-vignette z-[9999]" />

        <main className="relative z-10">{children}</main>

        <Toaster position="bottom-right" theme="dark" closeButton richColors />
      </body>
    </html>
  );
}
