'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Bot, Key, Settings, FileText, BarChart3, Bell, LogOut,
  ChevronLeft, ChevronRight, Shield, CreditCard, Activity, Database, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/agents', icon: Bot, label: 'AI Agents' },
  { href: '/admin/api-keys', icon: Key, label: 'API Keys' },
  { href: '/admin/blogs', icon: FileText, label: 'Blogs' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { href: '/admin/logs', icon: Activity, label: 'System Logs' },
  { href: '/admin/database', icon: Database, label: 'Database' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) {
      const parsed = JSON.parse(userData);
      // For now, allow admin@autotrading.com as admin
      // TODO: Add proper is_admin field in backend
      if (parsed.email !== 'admin@autotrading.com' && !parsed.is_admin && parsed.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(parsed);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Mobile Menu Button */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white">
        {mobileOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-gray-950 border-r border-gray-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Shield className="text-red-500" size={24}/>
                <span className="font-bold text-white">Admin Panel</span>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hidden lg:block">
              {collapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-red-600/20 text-red-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <Icon size={20}/>
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-gray-800">
            {!collapsed && (
              <div className="mb-3 px-3">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-all">
              <LogOut size={20}/>
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
            <Link href="/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all mt-1">
              <LayoutDashboard size={20}/>
              {!collapsed && <span className="text-sm font-medium">User Dashboard</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)}/>}

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
