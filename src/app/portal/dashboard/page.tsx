'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DEMO_ORDERS, DEMO_USER } from '@/lib/demo-data';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { Order } from '@/types';

const getStatusVariant = (status: string) => {
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending', 'action_required'].includes(status))
    return 'warning';
  return 'info';
};

const StatCard = ({
  title,
  value,
  icon: Icon,
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
          {Icon}
        </div>
      </div>
    </CardBody>
  </Card>
);

export default function DashboardPage() {
  const totalOrders = DEMO_ORDERS.length;
  const inProgressCount = DEMO_ORDERS.filter((o) =>
    [
      'submitted',
      'under_review',
      'sourcing',
      'sample_production',
      'sample_approval_pending',
      'manufacturing',
      'quality_check',
      'packing',
      'preparing_to_ship',
      'in_transit',
    ].includes(o.status)
  ).length;

  const awaitingActionCount = DEMO_ORDERS.filter(
    (o) => o.status === 'action_required'
  ).length;

  const deliveredCount = DEMO_ORDERS.filter(
    (o) => o.status === 'delivered'
  ).length;

  const recentOrders = DEMO_ORDERS.slice(0, 5);

  return (
    <PortalLayout
      pageTitle="Dashboard"
      userName={DEMO_USER.full_name}
      userEmail={DEMO_USER.email}
      companyName={DEMO_USER.company_name}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {DEMO_USER.full_name.split(' ')[0]}
        </h1>
        <p className="text-gray-600">
          Manage your orders and track their progress below.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="Awaiting Action"
          value={awaitingActionCount}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="Delivered"
          value={deliveredCount}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        />
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Order #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      #{order.id.split('_')[1]}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.product_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={getStatusVariant(order.status) as any}
                        size="sm"
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/portal/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
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
