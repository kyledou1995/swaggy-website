'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Record<string, { company_name?: string | null; full_name?: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  // Cancelled orders are archived: hidden from the active list, shown under "Archived"
  const [view, setView] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      setOrders(allOrders || []);

      // Client company names for the Company column
      const clientIds = [...new Set((allOrders || []).map((o: Order) => o.client_id).filter(Boolean))];
      if (clientIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, company_name, full_name')
          .in('id', clientIds);
        setClients(Object.fromEntries((profiles || []).map((p: { id: string; company_name: string | null; full_name: string | null }) => [p.id, p])));
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const activeCount = useMemo(() => orders.filter((o) => o.status !== 'cancelled').length, [orders]);
  const archivedCount = orders.length - activeCount;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const inView = view === 'archived' ? order.status === 'cancelled' : order.status !== 'cancelled';
      if (!inView) return false;
      const q = searchQuery.toLowerCase();
      const client = clients[order.client_id];
      const matchesSearch =
        (client?.company_name || '').toLowerCase().includes(q) ||
        (client?.full_name || '').toLowerCase().includes(q) ||
        (order.order_number || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.product_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.product_description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, clients, searchQuery, statusFilter, view]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.entries(ORDER_STATUS_LABELS)
      .filter(([value]) => value !== 'draft' && value !== 'cancelled')
      .map(([value, label]) => ({ value, label })),
  ];

  const badgeVariant = (status: string) =>
    status === 'cancelled' || status === 'action_required'
      ? 'error'
      : status === 'delivered'
        ? 'success'
        : status === 'sample_approval_pending'
          ? 'warning'
          : 'info';

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all client orders in one place.</p>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1" role="tablist">
          {([
            ['active', `Active (${activeCount})`],
            ['archived', `Archived (${archivedCount})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => {
                setView(key);
                setStatusFilter('all');
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by order #, company, client, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {view === 'active' && (
              <div className="md:w-64">
                <Select
                  label="Filter by Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                />
              </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {view === 'archived' ? 'Archived orders' : 'Orders'} ({filteredOrders.length})
              </h2>
              {view === 'archived' && (
                <p className="text-sm text-gray-500">Cancelled orders are archived automatically.</p>
              )}
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {view === 'archived'
                    ? 'No archived orders.'
                    : orders.length === 0
                      ? 'No orders have been placed yet.'
                      : 'No orders found matching your criteria.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{order.order_number || order.id.substring(0, 8)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{clients[order.client_id]?.company_name || '—'}</p>
                          {clients[order.client_id]?.full_name && (
                            <p className="text-sm text-gray-500">{clients[order.client_id]?.full_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.product_type}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{order.product_description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">{order.quantity.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={badgeVariant(order.status)}>
                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="primary" size="sm">Manage</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
