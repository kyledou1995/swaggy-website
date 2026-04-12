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
} from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createClient } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientRole, setClientRole] = useState('');
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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessSuccess, setBusinessSuccess] = useState('');
  const [businessError, setBusinessError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

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
        setEditName(profile.full_name || '');
        setEditCompanyName(profile.company_name || '');
        setBusinessAddress(profile.business_address || '');
        setDeliveryAddress(profile.delivery_address || '');
      } else {
        setUserName(user.user_metadata?.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(user.user_metadata?.company_name || '');
        setEditName(user.user_metadata?.full_name || '');
        setEditCompanyName(user.user_metadata?.company_name || '');
      }

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
          delivery_address: deliveryAddress.trim(),
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

  if (loading) {
    return (
      <PortalLayout pageTitle="Settings" userName={userName} userEmail={userEmail} companyName={companyName} clientRole={clientRole}>
        <div className="text-center py-16 text-gray-500">Loading settings...</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      pageTitle="Settings"
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
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                <p className="text-sm text-gray-500">Manage your company details and addresses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      Delivery Address
                    </span>
                  </label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={"Warehouse or delivery location\nCity, State 12345\nCountry"}
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Default address where orders will be delivered
                  </p>
                </div>
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
    </PortalLayout>
  );
}
