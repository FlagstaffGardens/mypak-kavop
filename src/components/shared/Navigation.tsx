'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              MyPak <span className="text-blue-600">Connect</span>
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors",
                isActive('/')
                  ? "border-blue-600 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/orders"
              className={cn(
                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors",
                isActive('/orders')
                  ? "border-blue-600 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Orders
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
