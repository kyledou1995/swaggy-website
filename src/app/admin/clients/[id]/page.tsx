'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Package,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Receipt,
  RefreshCw,
  Send,
  Download,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import { User, Order, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'financials'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', clientId).single(),
        supabase.from('orders').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) setClient(profileRes.data as User);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      setLoading(false);
    };

    loadData();
  }, [clientId]);

  const activeStatuses: OrderStatus[] = [
    'submitted', 'under_review', 'sourcing', 'quote_ready', 'quote_accepted',
    'deposit_required', 'deposit_paid', 'sample_production', 'sample_approval_pending',
    'sample_approved', 'manufacturing', 'quality_check', 'packing',
    'preparing_to_ship', 'in_transit', 'action_required',
  ];

  const financials = useMemo(() => {
    let totalRevenue = 0;
    let depositsPaid = 0;
    let refundsIssued = 0;
    let outstandingBalance = 0;

    orders.forEach(o => {
      const selectedPrice = o.selected_shipping === 'air'
        ? o.quote_air_price_per_unit
        : o.quote_ocean_price_per_unit;
      const orderTotal = (selectedPrice || 0) * o.quantity;

      if (o.selected_shipping) totalRevenue += orderTotal;
      if (o.deposit_paid && o.deposit_amount) depositsPaid += o.deposit_amount;
      if (o.refund_issued && o.refund_amount) refundsIssued += o.refund_amount;
      if (o.selected_shipping && !o.deposit_paid && o.status !== 'cancelled') {
        outstandingBalance += o.deposit_amount || orderTotal * 0.3;
      }
      if (o.deposit_paid && o.selected_shipping && o.status !== 'cancelled') {
        outstandingBalance += orderTotal - (o.deposit_amount || 0);
      }
    });

    return {
      totalRevenue,
      depositsPaid,
      refundsIssued,
      outstandingBalance,
      netReceived: depositsPaid - refundsIssued,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'active') return orders.filter(o => activeStatuses.includes(o.status));
    if (statusFilter === 'completed') return orders.filter(o => o.status === 'delivered');
    if (statusFilter === 'cancelled') return orders.filter(o => o.status === 'cancelled');
    return orders;
  }, [orders, statusFilter]);

  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">Loading client...</div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Client not found.</p>
          <Link href="/admin/clients" className="text-green-600 hover:underline mt-2 inline-block">
            Back to Clients
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Back link + Header */}
        <div>
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Clients
          </Link>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {client.company_name?.charAt(0) || client.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {client.company_name || client.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {client.full_name}
                </span>
                {client.business_address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {client.business_address}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Client since {new Date(client.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-400">{orders.filter(o => activeStatuses.includes(o.status)).length} active</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmt(financials.totalRevenue)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Deposits</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{fmt(financials.depositsPaid)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Refunds</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{fmt(financials.refundsIssued)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{fmt(financials.outstandingBalance)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'financials'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Financials
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Order Filters */}
            <div className="flex items-center gap-2">
              {['all', 'active', 'completed', 'cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === f
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'all' && ` (${orders.length})`}
                  {f === 'active' && ` (${orders.filter(o => activeStatuses.includes(o.status)).length})`}
                  {f === 'completed' && ` (${orders.filter(o => o.status === 'delivered').length})`}
                  {f === 'cancelled' && ` (${orders.filter(o => o.status === 'cancelled').length})`}
                </button>
              ))}
            </div>

            {/* Order List */}
            <Card>
              <CardBody className="p-0">
                {filteredOrders.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredOrders.map(order => {
                      const selectedPrice = order.selected_shipping === 'air'
                        ? order.quote_air_price_per_unit
                        : order.quote_ocean_price_per_unit;
                      const orderTotal = (selectedPrice || 0) * order.quantity;

                      return (
                        <Link
                          key={order.id}
                          href={`/admin/orders/${order.id}`}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">
                                #{order.order_number || order.id.slice(0, 8)}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                                {ORDER_STATUS_LABELS[order.status]}
                              </span>
                              {order.status === 'action_required' && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {order.product_type} · {order.quantity.toLocaleString()} units
                            </p>
                          </div>

                          <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase">Value</p>
                              <p className="font-semibold text-gray-900">
                                {orderTotal > 0 ? fmt(orderTotal) : '—'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase">Deposit</p>
                              <p className={`font-semibold ${order.deposit_paid ? 'text-green-600' : 'text-gray-400'}`}>
                                {order.deposit_paid ? fmt(order.deposit_amount || 0) : '—'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase">Created</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Order Value</span>
                    <span className="font-semibold text-gray-900">{fmt(financials.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Deposits Received</span>
                    <span className="font-semibold text-green-600">{fmt(financials.depositsPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Refunds Issued</span>
                    <span className="font-semibold text-red-500">-{fmt(financials.refundsIssued)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t-2 border-gray-900">
                    <span className="font-bold text-gray-900">Net Received</span>
                    <span className="font-bold text-gray-900 text-lg">{fmt(financials.netReceived)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Outstanding Balance</span>
                    <span className="font-semibold text-orange-500">{fmt(financials.outstandingBalance)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Per-Order Breakdown */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Order-by-Order Breakdown</h2>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order Value</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Deposit</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Refund</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map(order => {
                        const selectedPrice = order.selected_shipping === 'air'
                          ? order.quote_air_price_per_unit
                          : order.quote_ocean_price_per_unit;
                        const orderTotal = (selectedPrice || 0) * order.quantity;
                        const deposit = order.deposit_paid ? (order.deposit_amount || 0) : 0;
                        const refund = order.refund_issued ? (order.refund_amount || 0) : 0;
                        const balanceDue = order.status === 'cancelled' ? 0 : (orderTotal > 0 ? orderTotal - deposit : 0);

                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <Link href={`/admin/orders/${order.id}`} className="text-green-600 hover:underline font-medium">
                                #{order.order_number || order.id.slice(0, 8)}
                              </Link>
                              <p className="text-xs text-gray-400">{order.product_type}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                                {ORDER_STATUS_LABELS[order.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              {orderTotal > 0 ? fmt(orderTotal) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {deposit > 0 ? (
                                <span className="text-green-600 font-medium">{fmt(deposit)}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {refund > 0 ? (
                                <span className="text-red-500 font-medium">{fmt(refund)}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-right">
                              {balanceDue > 0 ? (
                                <span className="text-orange-500 font-semibold">{fmt(balanceDue)}</span>
                              ) : order.status === 'cancelled' ? (
                                <span className="text-gray-400">Cancelled</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
