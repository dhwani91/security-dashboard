// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Security Vulnerability Dashboard",
  description: "SQLite-powered vulnerability tracking system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🛡️ Security Dashboard
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
                  Dashboard
                </Link>
                <Link href="/vulnerabilities" className="text-gray-600 hover:text-gray-900 transition">
                  List View
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}