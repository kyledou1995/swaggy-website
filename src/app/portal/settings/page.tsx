'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Building2,
  Lock,
  MapPin,
  Truck,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Bell,
  Package,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import { DeliveryAddress } from '@/types';

interface AddressFormData {
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

const emptyAddress: AddressFormData = {
  label: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  zip_code: '',
  country: 'United States',
  is_default: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Business info state (owner only)
  const [editCompanyName, setEditCompanyName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessSuccess, setBusinessSuccess] = useState('');
  const [businessError, setBusinessError] = useState('');

  // Notification preferences state
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [notifyNewMessage, setNotifyNewMessage] = useState(true);
  const [emailOrderStatus, setEmailOrderStatus] = useState(true);
  const [emailNewMessage, setEmailNewMessage] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');

  // Delivery addresses state
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddress);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

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
        setOrganizationId(profile.organization_id || '');
        setEditName(profile.full_name || '');
        setEditCompanyName(profile.company_name || '');
        setBusinessAddress(profile.business_address || '');
        setNotifyOrderStatus(profile.notify_order_status !== false);
        setNotifyNewMessage(profile.notify_new_message !== false);
        setEmailOrderStatus(profile.email_order_status !== false);
        setEmailNewMessage(profile.email_new_message !== false);
      } else {
        setUserName(user.user_metadata?.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(user.user_metadata?.company_name || '');
        setEditName(user.user_metadata?.full_name || '');
        setEditCompanyName(user.user_metadata?.company_name || '');
      }

      // Load delivery addresses
      const { data: addressData } = await supabase
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      setAddresses(addressData || []);
      setAddressesLoading(false);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', user.id);

      if (error) throw error;
      setUserName(editName.trim());
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password changed successfully.');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!editCompanyName.trim()) {
      setBusinessError('Business name cannot be empty.');
      return;
    }
    setBusinessSaving(true);
    setBusinessError('');
    setBusinessSuccess('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: editCompanyName.trim(),
          business_address: businessAddress.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Propagate company name to all org members
      await supabase
        .from('profiles')
        .update({ company_name: editCompanyName.trim() })
        .eq('organization_id', profile.organization_id)
        .neq('id', user.id);

      setCompanyName(editCompanyName.trim());
      setBusinessSuccess('Business information updated successfully.');
      setTimeout(() => setBusinessSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving business info:', err);
      setBusinessError('Failed to update business information.');
    } finally {
      setBusinessSaving(false);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    setNotifSaving(true);
    setNotifError('');
    setNotifSuccess('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          notify_order_status: notifyOrderStatus,
          notify_new_message: notifyNewMessage,
          email_order_status: emailOrderStatus,
          email_new_message: emailNewMessage,
        })
        .eq('id', user.id);

      if (error) throw error;
      setNotifSuccess('Notification preferences saved.');
      setTimeout(() => setNotifSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      setNotifError('Failed to save preferences. Please try again.');
    } finally {
      setNotifSaving(false);
    }
  };

  const handleOpenAddressForm = (address?: DeliveryAddress) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        label: address.label,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        country: address.country,
        is_default: address.is_default,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({ ...emptyAddress, is_default: addresses.length === 0 });
    }
    setShowAddressForm(true);
    setAddressError('');
  };

  const handleCloseAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
    setAddressError('');
  };

  const handleSaveAddress = async () => {
    if (!addressForm.label.trim()) {
      setAddressError('Address label is required (e.g., "Main Warehouse").');
      return;
    }
    if (!addressForm.address_line1.trim()) {
      setAddressError('Street address is required.');
      return;
    }
    if (!addressForm.city.trim() || !addressForm.state.trim() || !addressForm.zip_code.trim()) {
      setAddressError('City, state, and zip code are all required.');
      return;
    }

    setAddressSaving(true);
    setAddressError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If marking as default, unset other defaults first
      if (addressForm.is_default) {
        await supabase
          .from('delivery_addresses')
          .update({ is_default: false })
          .eq('organization_id', organizationId);
      }

      if (editingAddressId) {
        // Update existing
        const { error } = await supabase
          .from('delivery_addresses')
          .update({
            label: addressForm.label.trim(),
            address_line1: addressForm.address_line1.trim(),
            address_line2: addressForm.address_line2.trim(),
            city: addressForm.city.trim(),
            state: addressForm.state.trim(),
            zip_code: addressForm.zip_code.trim(),
            country: addressForm.country.trim(),
            is_default: addressForm.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddressId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('delivery_addresses')
          .insert({
            organization_id: organizationId,
            label: addressForm.label.trim(),
            address_line1: addressForm.address_line1.trim(),
            address_line2: addressForm.address_line2.trim(),
            city: addressForm.city.trim(),
            state: addressForm.state.trim(),
            zip_code: addressForm.zip_code.trim(),
            country: addressForm.country.trim(),
            is_default: addressForm.is_default,
            created_by: user.id,
          });

        if (error) throw error;
      }

      // Reload addresses
      const { data: refreshed } = await supabase
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      setAddresses(refreshed || []);
      handleCloseAddressForm();
      setAddressSuccess(editingAddressId ? 'Address updated.' : 'Address added.');
      setTimeout(() => setAddressSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving address:', err);
      setAddressError('Failed to save address. Please try again.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setAddressSuccess('Address deleted.');
      setTimeout(() => setAddressSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const supabase = createClient();

      // Unset all defaults
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('organization_id', organizationId);

      // Set new default
      await supabase
        .from('delivery_addresses')
        .update({ is_default: true })
        .eq('id', id);

      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
    } catch (err) {
      console.error('Error setting default:', err);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Settings" userId={userId} userName={userName} userEmail={userEmail} companyName={companyName} clientRole={clientRole}>
        <div className="text-center py-16 text-gray-500">Loading settings...</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      pageTitle="Settings"
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      companyName={companyName}
      clientRole={clientRole}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your profile, security, and business information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Profile Section */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  value={userEmail}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {profileError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {profileSuccess}
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveProfile}
                disabled={profileSaving || editName === userName}
                isLoading={profileSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Password Section */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {passwordSuccess}
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleChangePassword}
                disabled={passwordSaving || !newPassword || !confirmPassword}
                isLoading={passwordSaving}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Business Information — Owner Only */}
      {clientRole === 'owner' && (
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                <p className="text-sm text-gray-500">Manage your company details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Business Name
                  </span>
                </label>
                <Input
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Business Address
                  </span>
                </label>
                <Textarea
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder={"123 Main St, Suite 100\nCity, State 12345\nCountry"}
                  rows={3}
                />
              </div>
            </div>

            {businessError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {businessError}
              </div>
            )}

            {businessSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2 mt-4">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {businessSuccess}
              </div>
            )}

            <div className="mt-6">
              <Button
                variant="primary"
                onClick={handleSaveBusiness}
                disabled={businessSaving || !editCompanyName.trim()}
                isLoading={businessSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Business Information
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Notification Preferences Section */}
      <Card className="mb-8" id="notifications">
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              <p className="text-sm text-gray-500">Choose how you want to be notified about activity</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Order Status Notifications */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Order Status Updates</h4>
                  <p className="text-sm text-gray-500">Get notified when your order status changes</p>
                </div>
              </div>
              <div className="space-y-3 ml-11">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">In-app notifications</span>
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
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Email notifications</span>
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
            </div>

            {/* New Message Notifications */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">New Messages</h4>
                  <p className="text-sm text-gray-500">Get notified when you receive a new message on an order</p>
                </div>
              </div>
              <div className="space-y-3 ml-11">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">In-app notifications</span>
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
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Email notifications</span>
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
            </div>
          </div>

          {notifError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2 mt-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {notifError}
            </div>
          )}

          {notifSuccess && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2 mt-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {notifSuccess}
            </div>
          )}

          <div className="mt-6">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNotificationPrefs}
              disabled={notifSaving}
              isLoading={notifSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Delivery Addresses Section */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery Addresses</h3>
                <p className="text-sm text-gray-500">Manage warehouse and delivery locations for your orders</p>
              </div>
            </div>
            {(clientRole === 'owner' || clientRole === 'manager') && !showAddressForm && (
              <Button variant="primary" size="sm" onClick={() => handleOpenAddressForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            )}
          </div>

          {addressSuccess && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {addressSuccess}
            </div>
          )}

          {/* Add/Edit Address Form */}
          {showAddressForm && (
            <div className="border border-green-200 bg-green-50/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </h4>
                <button onClick={handleCloseAddressForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Label *
                  </label>
                  <Input
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder='e.g., "Main Warehouse", "East Coast DC", "HQ"'
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <Input
                    value={addressForm.address_line1}
                    onChange={(e) => setAddressForm((p) => ({ ...p, address_line1: e.target.value }))}
                    placeholder="123 Warehouse Blvd"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <Input
                    value={addressForm.address_line2}
                    onChange={(e) => setAddressForm((p) => ({ ...p, address_line2: e.target.value }))}
                    placeholder="Suite, unit, building, floor, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                  <Input
                    value={addressForm.zip_code}
                    onChange={(e) => setAddressForm((p) => ({ ...p, zip_code: e.target.value }))}
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <Input
                    value={addressForm.country}
                    onChange={(e) => setAddressForm((p) => ({ ...p, country: e.target.value }))}
                    placeholder="United States"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm((p) => ({ ...p, is_default: e.target.checked }))}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Set as default delivery address</span>
                  </label>
                </div>
              </div>

              {addressError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {addressError}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAddress}
                  disabled={addressSaving}
                  isLoading={addressSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCloseAddressForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Address List */}
          {addressesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading addresses...</div>
          ) : addresses.length === 0 && !showAddressForm ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">No delivery addresses yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Add your warehouse or delivery locations to use when placing orders.
              </p>
              {(clientRole === 'owner' || clientRole === 'manager') && (
                <Button variant="primary" size="sm" onClick={() => handleOpenAddressForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Address
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`border rounded-xl p-4 transition-colors ${
                    addr.is_default ? 'border-green-300 bg-green-50/40' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{addr.label}</span>
                        {addr.is_default && (
                          <Badge variant="success">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {addr.address_line1}
                        {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addr.city}, {addr.state} {addr.zip_code}
                      </p>
                      <p className="text-sm text-gray-500">{addr.country}</p>
                    </div>

                    {(clientRole === 'owner' || clientRole === 'manager') && (
                      <div className="flex items-center gap-1 ml-4">
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenAddressForm(addr)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {clientRole === 'owner' && (
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </PortalLayout>
  );
}
