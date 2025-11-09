import type { Metadata } from "next";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPak Connect VMI",
  description: "Vendor Managed Inventory System for Egg Carton Distribution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Desktop Sidebar - Hidden on mobile (< md), visible on desktop (md+) */}
            <div className="hidden md:block">
              <Sidebar />
            </div>

            {/* Mobile Navigation - Only visible on mobile (< md) */}
            <MobileNav />

            {/* Main Content - Adjusted padding for mobile */}
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
