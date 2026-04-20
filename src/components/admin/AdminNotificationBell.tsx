'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Package, MessageSquare, Check, CheckCheck, X, CreditCard, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { AppNotification } from '@/types';
import Link from 'next/link';

interface AdminNotificationBellProps {
  userId?: string;
}

export const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMarkingRef = useRef(false);

  const loadNotifications = async () => {
    if (!userId || isMarkingRef.current) return;
    const supabase = createClient();

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('target_role', 'admin')
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && !isMarkingRef.current) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (notifId: string) => {
    isMarkingRef.current = true;
    const supabase = createClient();

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);

    isMarkingRef.current = false;
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    isMarkingRef.current = true;
    const supabase = createClient();

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('target_role', 'admin')
      .eq('is_read', false);

    isMarkingRef.current = false;
    // Re-fetch to confirm DB state
    setTimeout(() => loadNotifications(), 500);
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return <Package className="w-4 h-4 text-green-400" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'order_status':
        return 'bg-green-900/50';
      case 'new_message':
        return 'bg-blue-900/50';
      default:
        return 'bg-gray-800';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white text-sm">Admin Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll be notified when clients take actions
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/60 transition-colors cursor-pointer ${
                    !notif.is_read ? 'bg-green-900/10' : ''
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                  }}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${getIconBg(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-500">{getTimeAgo(notif.created_at)}</span>
                      {notif.order_id && (
                        <Link
                          href={`/admin/orders/${notif.order_id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notif.is_read) markAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="text-[10px] text-green-400 hover:text-green-300 font-medium"
                        >
                          View Order
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
