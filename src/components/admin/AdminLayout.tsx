'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Users,
  Building2,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { createClient } from '@/lib/supabase';
import { User } from '@/types';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          if (profileData.role !== 'admin') {
            router.push('/portal/dashboard');
            return;
          }
          setUser(profileData as User);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Clients',
      href: '/admin/clients',
      icon: Building2,
    },
    {
      label: 'All Orders',
      href: '/admin/orders',
      icon: Package,
    },
    {
      label: 'Messages',
      href: '/admin/messages',
      icon: MessageSquare,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">swaggy</div>
            <Badge variant="neutral" className="bg-gray-700 text-gray-100">
              Admin
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-green-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin User Info */}
        {!isLoading && user && (
          <div className="px-4 py-4 border-t border-gray-800">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold flex-shrink-0">
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
                <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 rounded-lg border border-gray-700 py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-end px-6 flex-shrink-0">
          {!isLoading && user && (
            <AdminNotificationBell userId={user.id} />
          )}
        </div>

        <div className="flex-1 overflow-auto bg-white">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
