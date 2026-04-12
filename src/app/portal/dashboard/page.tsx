'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle,
  User as UserIcon,
  Building2,
  Lock,
  MapPin,
  Truck,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Order } from '@/types';

const getStatusVariant = (status: string) => {
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending'].includes(status)) return 'warning';
  return 'info';
};

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardBody>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </CardBody>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
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

      // Get profile
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

      // Get orders for this user
      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(userOrders || []);
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

      // Get the user's org to update all org members' company_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Update current user's profile with all business info
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: editCompanyName.trim(),
          business_address: businessAddress.trim(),
          delivery_address: deliveryAddress.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Also update company_name for all org members
      const { error: orgError } = await supabase
        .from('profiles')
        .update({ company_name: editCompanyName.trim() })
        .eq('organization_id', profile.organization_id)
        .neq('id', user.id);

      if (orgError) console.error('Error updating org members:', orgError);

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

  const totalOrders = orders.length;
  const inProgressCount = orders.filter((o) =>
    ['submitted', 'under_review', 'sourcing', 'sample_production', 'sample_approval_pending', 'manufacturing', 'quality_check', 'packing', 'preparing_to_ship', 'in_transit'].includes(o.status)
  ).length;
  const awaitingActionCount = orders.filter((o) => o.status === 'action_required').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const recentOrders = orders.slice(0, 5);

  return (
    <PortalLayout
      pageTitle="Dashboard"
      userName={userName}
      userEmail={userEmail}
      companyName={companyName}
      clientRole={clientRole}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-600">
          Manage your orders and track their progress below.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Orders" value={totalOrders} icon={<Package className="w-6 h-6 text-green-600" />} />
        <StatCard title="In Progress" value={inProgressCount} icon={<TrendingUp className="w-6 h-6 text-green-600" />} />
        <StatCard title="Awaiting Action" value={awaitingActionCount} icon={<AlertCircle className="w-6 h-6 text-green-600" />} />
        <StatCard title="Delivered" value={deliveredCount} icon={<CheckCircle className="w-6 h-6 text-green-600" />} />
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <Link href="/portal/orders">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <Card>
          {loading ? (
            <CardBody>
              <div className="text-center py-8 text-gray-500">Loading orders...</div>
            </CardBody>
          ) : recentOrders.length === 0 ? (
            <CardBody>
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">Create your first order to get started.</p>
                <Link href="/portal/orders/new">
                  <Button variant="primary">Create Your First Order</Button>
                </Link>
              </div>
            </CardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: Order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {order.order_number || order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.product_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(order.status) as any} size="sm">
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/portal/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-12">
        <Link href="/portal/orders/new">
          <Button variant="primary">Create New Order</Button>
        </Link>
        <Link href="/portal/orders">
          <Button variant="secondary">View All Orders</Button>
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-10 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Account Settings</h2>
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
              {/* Left column */}
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
                    placeholder="123 Main St, Suite 100&#10;City, State 12345&#10;Country"
                    rows={3}
                  />
                </div>
              </div>

              {/* Right column */}
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
                    placeholder="Warehouse or delivery location&#10;City, State 12345&#10;Country"
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
