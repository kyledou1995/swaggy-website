'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Package,
  MessageSquare,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Notification preferences state
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [notifyNewMessage, setNotifyNewMessage] = useState(true);
  const [emailOrderStatus, setEmailOrderStatus] = useState(true);
  const [emailNewMessage, setEmailNewMessage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(profile.company_name || '');
        setClientRole(profile.client_role || 'owner');
        setNotifyOrderStatus(profile.notify_order_status !== false);
        setNotifyNewMessage(profile.notify_new_message !== false);
        setEmailOrderStatus(profile.email_order_status !== false);
        setEmailNewMessage(profile.email_new_message !== false);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notify_order_status: notifyOrderStatus,
          notify_new_message: notifyNewMessage,
          email_order_status: emailOrderStatus,
          email_new_message: emailNewMessage,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setSuccess('Notification preferences saved.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Notification Preferences" userId={userId} userName={userName} userEmail={userEmail} companyName={companyName} clientRole={clientRole}>
        <div className="text-center py-16 text-gray-500">Loading preferences...</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      pageTitle="Notification Preferences"
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      companyName={companyName}
      clientRole={clientRole}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
        <p className="text-gray-600">Choose how you want to be notified about activity on your orders and messages.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Order Status Notifications */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order Status Updates</h3>
                <p className="text-sm text-gray-500">Get notified when your order status changes</p>
              </div>
            </div>
            <div className="space-y-4 ml-13">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">In-app notifications</span>
                    <p className="text-xs text-gray-400">See alerts in the notification bell</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyOrderStatus}
                  onClick={() => setNotifyOrderStatus(!notifyOrderStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    notifyOrderStatus ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifyOrderStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <div className="border-t border-gray-100" />
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email notifications</span>
                    <p className="text-xs text-gray-400">Receive an email when status changes</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailOrderStatus}
                  onClick={() => setEmailOrderStatus(!emailOrderStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    emailOrderStatus ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailOrderStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* New Message Notifications */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">New Messages</h3>
                <p className="text-sm text-gray-500">Get notified when you receive a new message on an order</p>
              </div>
            </div>
            <div className="space-y-4 ml-13">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">In-app notifications</span>
                    <p className="text-xs text-gray-400">See alerts in the notification bell</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyNewMessage}
                  onClick={() => setNotifyNewMessage(!notifyNewMessage)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    notifyNewMessage ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifyNewMessage ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <div className="border-t border-gray-100" />
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email notifications</span>
                    <p className="text-xs text-gray-400">Receive an email for new messages</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailNewMessage}
                  onClick={() => setEmailNewMessage(!emailNewMessage)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    emailNewMessage ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNewMessage ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Save / Status */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          isLoading={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </PortalLayout>
  );
}
