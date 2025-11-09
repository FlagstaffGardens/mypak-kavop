'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Package, Settings, LogOut, Sun, Moon, User, ChevronLeft, ChevronRight, Palette, Beaker, ChevronDown, ChevronUp } from 'lucide-react';
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

type DemoState = 'healthy' | 'single_urgent' | 'multiple_urgent';

const STATE_CONFIG: Record<DemoState, { label: string; emoji: string; color: string }> = {
  healthy: { label: 'Healthy', emoji: '✅', color: 'text-green-700 dark:text-green-400' },
  single_urgent: { label: 'Single Urgent', emoji: '⚠️', color: 'text-amber-700 dark:text-amber-400' },
  multiple_urgent: { label: 'Multiple Urgent', emoji: '🚨', color: 'text-red-700 dark:text-red-400' },
};

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
              'block rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer',
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
  const { theme, setTheme } = useTheme();

  // Always start with default values to avoid hydration mismatch
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [demoState, setDemoState] = useState<DemoState>('healthy');
  const [showDevTools] = useState(() =>
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true'
  );
  const [ordersExpanded, setOrdersExpanded] = useState(pathname.startsWith('/orders'));

  // Load saved state from localStorage after hydration
  // This is the correct pattern to avoid hydration mismatches.
  // Server must render default values, then client updates from localStorage after hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/exhaustive-deps */
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }

    const savedState = localStorage.getItem('demoState') as DemoState | null;
    if (savedState) {
      setDemoState(savedState);
    }
    /* eslint-enable react-hooks/exhaustive-deps */
  }, []);

  // Sync ordersExpanded with pathname changes
  useEffect(() => {
    setOrdersExpanded(pathname.startsWith('/orders'));
  }, [pathname]);

  // Handle demo state change
  const handleDemoStateChange = (state: DemoState) => {
    setDemoState(state);
    localStorage.setItem('demoState', state);
    // Trigger a page reload to apply the new state
    window.location.reload();
  };

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: pathname === '/',
    },
  ];

  // Placeholder user data - will be replaced with real auth later
  const user = {
    name: 'Demo User',
    email: 'demo@mypak.com',
    initials: 'DU',
  };

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-white dark:bg-gray-950 dark:border-gray-800 transition-[width] duration-200 ease-out will-change-[width]",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and Collapse Button */}
      <div className="flex h-14 items-center justify-between border-b dark:border-gray-800 px-3">
        <span className={cn(
          "text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 transition-opacity duration-150 ease-out",
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>
          MyPak
        </span>
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
                'group flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer',
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
      </nav>

      {/* Dev Tools - State Switcher */}
      {showDevTools && (
        <div className="border-t dark:border-gray-800 p-2">
          <div className={cn(
            "rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-2",
            isCollapsed && "px-1"
          )}>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Beaker className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Dev Mode
                </span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full text-left rounded-md px-2 py-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer",
                    "flex items-center gap-2 text-sm font-medium",
                    STATE_CONFIG[demoState].color,
                    isCollapsed && "justify-center px-1"
                  )}
                  title={isCollapsed ? `Demo State: ${STATE_CONFIG[demoState].label}` : undefined}
                >
                  <span className="text-base">{STATE_CONFIG[demoState].emoji}</span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-xs truncate">
                        {STATE_CONFIG[demoState].label}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs">Demo State</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(STATE_CONFIG).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleDemoStateChange(key as DemoState)}
                    className={cn(
                      "cursor-pointer text-sm",
                      demoState === key && "bg-purple-100 dark:bg-purple-900/30"
                    )}
                  >
                    <span className="mr-2">{config.emoji}</span>
                    <span>{config.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* User Menu */}
      <div className="border-t p-2 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full outline-none">
            <div className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer",
              isCollapsed && "justify-center px-0"
            )}>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "flex flex-col items-start flex-1 min-w-0 transition-opacity duration-150 ease-out",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-50 truncate whitespace-nowrap">
                  {user.name}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate whitespace-nowrap">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="cursor-not-allowed">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
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
            <DropdownMenuItem disabled className="cursor-not-allowed">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
