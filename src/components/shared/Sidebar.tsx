'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Package, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

// Sub-component for Orders navigation that uses useSearchParams
function OrdersSubNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ordersSubNav = [
    { name: 'Recommended', href: '/orders?tab=recommended' },
    { name: 'Live', href: '/orders?tab=live' },
    { name: 'Completed', href: '/orders?tab=completed' },
  ];

  if (isCollapsed) return null;

  return (
    <div className="ml-6 mt-1 space-y-0.5 border-l border-gray-200 dark:border-gray-700 pl-3">
      {ordersSubNav.map((subItem) => {
        // Extract tab parameter from href (e.g., "/orders?tab=recommended" -> "recommended")
        const tabParam = subItem.href.split('tab=')[1];
        const currentTab = searchParams.get('tab') || 'recommended';
        const isActive = tabParam === currentTab && pathname === '/orders';

        return (
          <Link
            key={subItem.name}
            href={subItem.href}
            className={cn(
              'block rounded-md px-2 py-1 text-sm font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50'
            )}
          >
            {subItem.name}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  // Always start with default values to avoid hydration mismatch
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(pathname.startsWith('/orders'));

  // Load saved state from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Sync ordersExpanded with pathname changes
  useEffect(() => {
    setOrdersExpanded(pathname.startsWith('/orders'));
  }, [pathname]);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: pathname === '/',
    },
  ];

  // Add initials to user data
  const userWithInitials = user
    ? {
        ...user,
        initials: user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }
    : null;

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-white dark:bg-gray-950 dark:border-gray-800 transition-[width] duration-200 ease-out will-change-[width]",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and Collapse Button */}
      <div className="flex h-14 items-center justify-between border-b dark:border-gray-800 px-3">
        <div className={cn(
          "flex flex-col transition-opacity duration-150 ease-out",
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>
          <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            MyPak
          </span>
          {user?.orgName && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.orgName}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn("h-8 w-8 shrink-0 cursor-pointer", isCollapsed && "mx-auto")}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center rounded-md px-2 py-1.5 text-base font-medium transition-colors cursor-pointer',
                isCollapsed ? 'justify-center' : '',
                item.current
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  !isCollapsed && 'mr-2',
                  item.current
                    ? 'text-gray-900 dark:text-gray-50'
                    : 'text-gray-500 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-50'
                )}
              />
              <span className={cn(
                "transition-opacity duration-150 ease-out whitespace-nowrap",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Orders with Sub-navigation */}
        <div>
          <div className="flex items-center">
            <Link
              href="/orders"
              title={isCollapsed ? 'Orders' : undefined}
              className={cn(
                'group flex flex-1 items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                isCollapsed ? 'justify-center' : '',
                pathname.startsWith('/orders')
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50'
              )}
            >
              <Package
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  !isCollapsed && 'mr-2',
                  pathname.startsWith('/orders')
                    ? 'text-gray-900 dark:text-gray-50'
                    : 'text-gray-500 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-50'
                )}
              />
              <span className={cn(
                "flex-1 text-left transition-opacity duration-150 ease-out whitespace-nowrap",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                Orders
              </span>
            </Link>
            {!isCollapsed && (
              <button
                onClick={() => setOrdersExpanded(!ordersExpanded)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {ordersExpanded ? (
                  <ChevronUp className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                )}
              </button>
            )}
          </div>

          {/* Sub-navigation */}
          {ordersExpanded && (
            <Suspense fallback={null}>
              <OrdersSubNav isCollapsed={isCollapsed} />
            </Suspense>
          )}
        </div>

        {/* Admin Link - only show for platform_admin */}
        {user?.role === 'platform_admin' && (
          <Link
            href="/admin/organizations"
            title={isCollapsed ? 'Admin' : undefined}
            className={cn(
              'group flex items-center rounded-md px-2 py-1.5 text-base font-medium transition-colors cursor-pointer',
              isCollapsed ? 'justify-center' : '',
              pathname.startsWith('/admin')
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50'
            )}
          >
            <Settings
              className={cn(
                'h-4 w-4 flex-shrink-0',
                !isCollapsed && 'mr-2',
                pathname.startsWith('/admin')
                  ? 'text-gray-900 dark:text-gray-50'
                  : 'text-gray-500 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-gray-50'
              )}
            />
            <span className={cn(
              "transition-opacity duration-150 ease-out whitespace-nowrap",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              Admin
            </span>
          </Link>
        )}
      </nav>

      {/* User Menu */}
      <div className="border-t p-2 dark:border-gray-800">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full outline-none">
              <div className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer",
                isCollapsed && "justify-center px-0"
              )}>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                    {userWithInitials?.initials || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "flex flex-col items-start flex-1 min-w-0 transition-opacity duration-150 ease-out",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate whitespace-nowrap">
                    {userWithInitials?.name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate whitespace-nowrap">
                    {userWithInitials?.email || ''}
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer">
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center justify-center py-2">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
