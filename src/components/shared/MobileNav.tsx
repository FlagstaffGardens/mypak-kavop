'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid use case: syncing UI state with external navigation state
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button - Only visible on mobile (< md) */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800 cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-900 dark:text-gray-50" />
      </button>

      {/* Backdrop - Only visible when drawer is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer Sidebar - Only visible on mobile (< md) */}
      <div
        className={`
          md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950
          transform transition-transform duration-200 ease-in-out
          shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-gray-900 dark:text-gray-50" />
        </button>

        {/* Sidebar content */}
        <Sidebar />
      </div>
    </>
  );
}
