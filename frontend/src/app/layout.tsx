import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Health Guardian",
  description:
    "Detect health risks instantly using artificial intelligence — VoltHacks 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-[#0a0f1e] text-slate-100 antialiased`}>
        <nav className="sticky top-0 z-50 border-b border-[#1f2a44]/80 bg-[#0a0f1e]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-white transition hover:text-emerald-400 sm:text-lg"
            >
              🫀 AI Health Guardian
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-3 text-sm sm:gap-5 sm:text-base">
              <Link href="/" className="text-slate-300 transition hover:text-white">
                Home
              </Link>
              <Link href="/analyze" className="text-slate-300 transition hover:text-white">
                Analyze
              </Link>
              <Link href="/history" className="text-slate-300 transition hover:text-white">
                History
              </Link>
              <Link href="/chat" className="text-slate-300 transition hover:text-white">
                Chat
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-[calc(100vh-65px)]">{children}</main>
      </body>
    </html>
  );
}
