import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, LayoutDashboard, Upload } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Performance Dashboard",
  description: "Daily CRM performance reporting from Opportunities & Tasks uploads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur no-print">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <span className="text-lg">CRM Insights</span>
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">{children}</main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground no-print">
            CRM Performance Dashboard · Built with Next.js
          </footer>
        </div>
      </body>
    </html>
  );
}
