'use client';

import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle, Users, DollarSign, Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DEMO_ORDERS, DEMO_UPDATES, DEMO_MESSAGES } from '@/lib/demo-data';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/constants';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const stats = useMemo(() => {
    const totalOrders = DEMO_ORDERS.length;
    const activeOrders = DEMO_ORDERS.filter(
      (o) => !['delivered', 'cancelled'].includes(o.status)
    ).length;
    const pendingActions = DEMO_ORDERS.filter(
      (o) => o.status === 'action_required' || o.status === 'sample_approval_pending'
    ).length;
    const uniqueClients = new Set(DEMO_ORDERS.map((o) => o.client_id)).size;

    // Rough calculation based on quantities and target prices
    const revenue = DEMO_ORDERS.reduce(
      (sum, order) => sum + order.quantity * order.target_price,
      0
    );

    return {
      totalOrders,
      activeOrders,
      pendingActions,
      uniqueClients,
      revenue,
    };
  }, []);

  const ordersNeedingAction = DEMO_ORDERS.filter(
    (order) =>
      order.status === 'action_required' || order.status === 'sample_approval_pending'
  );

  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    DEMO_ORDERS.forEach((order) => {
      distribution[order.status] = (distribution[order.status] || 0) + 1;
    });
    return distribution;
  }, []);

  const topStatuses = Object.entries(statusDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const maxCount = Math.max(...topStatuses.map(([, count]) => count), 1);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your order overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeOrders}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="text-purple-600" size={24} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Actions</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.pendingActions}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.uniqueClients}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Est. Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${(stats.revenue / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Orders Requiring Action */}
        {ordersNeedingAction.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">
                  Orders Requiring Action
                </h2>
                <Badge variant="error">{ordersNeedingAction.length}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {ordersNeedingAction.map((order) => {
                  const lastUpdate = DEMO_UPDATES.filter(
                    (u) => u.order_id === order.id
                  ).sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )[0];

                  return (
                    <div
                      key={order.id}
                      className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            Order {order.id}
                          </p>
                          <Badge
                            variant={
                              order.status === 'sample_approval_pending'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {
                              ORDER_STATUS_LABELS[
                                order.status as keyof typeof ORDER_STATUS_LABELS
                              ]
                            }
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.product_description}
                        </p>
                        {lastUpdate && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            {lastUpdate.message}
                          </p>
                        )}
                      </div>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="primary" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Order Status Distribution
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {topStatuses.map(([status, count]) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {
                          ORDER_STATUS_LABELS[
                            status as keyof typeof ORDER_STATUS_LABELS
                          ]
                        }
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {DEMO_UPDATES.slice(0, 4).map((update) => (
                  <div key={update.id} className="border-l-2 border-green-500 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Order {update.order_id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(update.created_at).toLocaleDateString()} at{' '}
                          {new Date(update.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {update.requires_action && (
                        <Badge variant="warning" className="flex-shrink-0">
                          Action
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {update.message}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

