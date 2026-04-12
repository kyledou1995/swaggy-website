'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, Users, DollarSign, Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Order } from '@/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      setOrders(allOrders || []);
      setLoading(false);
    }

    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter(
      (o) => !['delivered', 'cancelled'].includes(o.status)
    ).length;
    const pendingActions = orders.filter(
      (o) => o.status === 'action_required' || o.status === 'sample_approval_pending'
    ).length;
    const uniqueClients = new Set(orders.map((o) => o.client_id)).size;
    const revenue = orders.reduce(
      (sum, order) => sum + order.quantity * order.target_price,
      0
    );
    return { totalOrders, activeOrders, pendingActions, uniqueClients, revenue };
  }, [orders]);

  const ordersNeedingAction = orders.filter(
    (order) => order.status === 'action_required' || order.status === 'sample_approval_pending'
  );

  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    orders.forEach((order) => {
      distribution[order.status] = (distribution[order.status] || 0) + 1;
    });
    return distribution;
  }, [orders]);

  const topStatuses = Object.entries(statusDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const maxCount = Math.max(...topStatuses.map(([, count]) => count), 1);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your order overview.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">Orders will appear here once clients start placing them.</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardBody className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
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
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeOrders}</p>
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
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.pendingActions}</p>
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
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.uniqueClients}</p>
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
                    <h2 className="text-lg font-semibold text-gray-900">Orders Requiring Action</h2>
                    <Badge variant="error">{ordersNeedingAction.length}</Badge>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {ordersNeedingAction.map((order) => (
                      <div key={order.id} className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{order.order_number || order.id.substring(0, 8)}</p>
                            <Badge variant={order.status === 'sample_approval_pending' ? 'warning' : 'error'}>
                              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{order.product_description}</p>
                        </div>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="primary" size="sm">Manage</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              {topStatuses.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900">Order Status Distribution</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {topStatuses.map(([status, count]) => (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border-l-2 border-green-500 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {order.order_number || order.id.substring(0, 8)} — {order.product_type}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'action_required' ? 'error' : 'info'}>
                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
