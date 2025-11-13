"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/sign-in");
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {isAuthPage || isAdminPage ? (
            // Auth pages and admin pages - no regular sidebar, handled by their own layouts
            <>{children}</>
          ) : (
            // App pages - with sidebar
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
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
