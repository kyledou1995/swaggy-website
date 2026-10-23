'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Order } from '@/types';
import { CountUp, Skeleton, stagger } from '@/components/ui/Animated';

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
  loading,
  index,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  index: number;
}) => (
  <div className="animate-fade-up" style={stagger(index)}>
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                <CountUp value={value} />
              </p>
            )}
          </div>
          <div className="hidden sm:flex w-12 h-12 bg-green-100 rounded-lg items-center justify-center shrink-0">
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);

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
      } else {
        setUserName(user.user_metadata?.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(user.user_metadata?.company_name || '');
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
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      companyName={companyName}
      clientRole={clientRole}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-600">
          Manage your orders and track their progress below.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
        <StatCard index={0} loading={loading} title="Total Orders" value={totalOrders} icon={<Package className="w-6 h-6 text-green-600" />} />
        <StatCard index={1} loading={loading} title="In Progress" value={inProgressCount} icon={<TrendingUp className="w-6 h-6 text-green-600" />} />
        <StatCard index={2} loading={loading} title="Awaiting Action" value={awaitingActionCount} icon={<AlertCircle className="w-6 h-6 text-green-600" />} />
        <StatCard index={3} loading={loading} title="Delivered" value={deliveredCount} icon={<CheckCircle className="w-6 h-6 text-green-600" />} />
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
            <div className="divide-y divide-gray-100">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
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
            <>
            {/* Mobile: card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {recentOrders.map((order: Order, i) => (
                <Link
                  key={order.id}
                  href={`/portal/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 animate-fade-up active:bg-gray-50"
                  style={stagger(i, 70, 200)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">#{order.order_number || order.id.substring(0, 8)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.product_type} · {order.quantity.toLocaleString()} units
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(order.status) as any} size="sm">
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </Link>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
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
                  {recentOrders.map((order: Order, i) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-fade-up" style={stagger(i, 70, 200)}>
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
            </>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Link href="/portal/orders/new">
          <Button variant="primary">Create New Order</Button>
        </Link>
        <Link href="/portal/orders">
          <Button variant="secondary">View All Orders</Button>
        </Link>
      </div>
    </PortalLayout>
  );
}
