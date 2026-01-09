'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Settings, 
  CreditCard, 
  Key, 
  TrendingUp, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Bell,
  Plus,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Workflow,
  BarChart3,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, theme, toggleTheme, user, unreadCount, sidebarMinimized, toggleSidebarMinimized } = useStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Add MT5 Account', href: '/dashboard/add-account', icon: Plus },
    { name: 'TradingView Bridge', href: '/dashboard/bridge', icon: LinkIcon },
    { name: 'Agentic Automations', href: '/dashboard/agentic', icon: Workflow },
    { name: 'AI Assistant', href: '/dashboard/ai-chat', icon: MessageSquare },
    { name: 'Strategy Backtester', href: '/dashboard/backtest', icon: BarChart3 },
    { name: 'Trades', href: '/dashboard/trades', icon: TrendingUp },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: unreadCount },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out',
          'bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Width: full on mobile, toggled on lg+
          'w-64',
          sidebarMinimized ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={clsx('relative p-4 border-b border-gray-200 dark:border-gray-800 flex items-center', sidebarMinimized ? 'justify-center' : 'justify-between')}>
            {!sidebarMinimized && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Trading Maven
              </h2>
            )}
            {/* Mobile close */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-white" />
            </button>
            {/* Minimize/Expand toggle (always visible on desktop) */}
            <button
              onClick={toggleSidebarMinimized}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebarMinimized(); } }}
              aria-label={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
              aria-pressed={sidebarMinimized}
              title={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
              className={clsx(
                'absolute top-2 right-2 hidden lg:flex items-center justify-center',
                'p-2 rounded-lg border border-gray-600',
                'bg-gray-800 hover:bg-gray-700',
                'transition-colors'
              )}
            >
              {sidebarMinimized ? <ChevronRight size={18} className="text-white" /> : <ChevronLeft size={18} className="text-white" />}
            </button>
          </div>

          {/* User info (hidden in minimized state) */}
          {user && !sidebarMinimized && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 mt-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className={clsx('flex-1 overflow-y-auto space-y-1', sidebarMinimized ? 'p-2 pt-6' : 'p-4 pt-6')}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center rounded-lg transition-all duration-300 relative',
                    sidebarMinimized ? 'justify-center px-2 py-2' : 'space-x-3 px-3 py-2',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onClick={() => {
                    // Close sidebar on mobile after clicking
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                >
                  <item.icon size={20} />
                  {!sidebarMinimized && <span className="flex-1">{item.name}</span>}
                  {item.badge && item.badge > 0 && (
                    <span className={clsx('px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white', sidebarMinimized && 'absolute -top-1 -right-1')}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer (hidden in minimized state) */}
          {!sidebarMinimized && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            {/* Admin Panel Link - Only for admin users */}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Shield size={20} />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            </div>
          )}
        </div>
      </aside>

      {/* Toggle button for mobile */}
      <button
        onClick={toggleSidebar}
        className={clsx(
          'fixed top-4 left-4 z-30 p-2 rounded-lg bg-gray-900 border border-gray-700 shadow-lg lg:hidden',
          'hover:bg-gray-800 transition-colors'
        )}
      >
        <Menu size={24} className="text-white" />
      </button>
    </>
  );
}
