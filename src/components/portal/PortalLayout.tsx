'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
  LayoutDashboard,
  ShoppingCart,
  Plus,
  MessageSquare,
  Menu,
  X,
  LogOut,
  User,
  Users,
  Settings,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/portal/NotificationBell';

interface PortalLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  userEmail?: string;
  userName?: string;
  companyName?: string;
  clientRole?: string;
  userId?: string;
}

const NAV_LINKS = [
  {
    label: 'Dashboard',
    href: '/portal/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Orders',
    href: '/portal/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Messages',
    href: '/portal/messages',
    icon: MessageSquare,
  },
  {
    label: 'New Order',
    href: '/portal/orders/new',
    icon: Plus,
  },
  {
    label: 'Team',
    href: '/portal/team',
    icon: Users,
    ownerOnly: true,
  },
];

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  pageTitle,
  userEmail = 'john@techstartup.com',
  userName = 'John Martinez',
  companyName = 'TechStartup Inc',
  clientRole = 'owner',
  userId,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative w-64 h-screen bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">
            <span className="text-green-600">swaggy</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {NAV_LINKS.filter((link) => !(link as any).ownerOnly || clientRole === 'owner').map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link key={link.href} href={link.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    active
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">COMPANY</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {companyName}
            </p>
            <p className="text-xs text-gray-500 mt-1">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Page Title */}
            <h2 className="text-xl font-semibold text-gray-900">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell userId={userId} />

          {/* User Avatar with Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </div>

            {/* Dropdown Menu — pt-2 acts as invisible hover bridge */}
            <div className="absolute right-0 top-full w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>
              </div>
              <div className="py-1">
                <Link href="/portal/settings">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account Settings
                  </div>
                </Link>
                <Link href="/portal/settings#notifications">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Bell className="w-4 h-4 text-gray-400" />
                    Notification Preferences
                  </div>
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
            </div>
          </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
