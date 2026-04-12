'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Building2, Search, Package, DollarSign, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase';
import { User, Order } from '@/types';
import Link from 'next/link';

interface ClientSummary {
  profile: User;
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  depositsPaid: number;
  refundsIssued: number;
  outstandingBalance: number;
  lastOrderDate: string | null;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Get all client profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('company_name', { ascending: true });

      // Get all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profiles) { setLoading(false); return; }

      const allOrders = (orders || []) as Order[];

      const clientSummaries: ClientSummary[] = profiles.map((profile: User) => {
        const clientOrders = allOrders.filter(o => o.client_id === profile.id);
        const activeStatuses = ['submitted', 'under_review', 'sourcing', 'quote_ready', 'quote_accepted', 'deposit_required', 'deposit_paid', 'sample_production', 'sample_approval_pending', 'sample_approved', 'manufacturing', 'quality_check', 'packing', 'preparing_to_ship', 'in_transit', 'action_required'];

        let totalRevenue = 0;
        let depositsPaid = 0;
        let refundsIssued = 0;
        let outstandingBalance = 0;

        clientOrders.forEach(o => {
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
          profile,
          totalOrders: clientOrders.length,
          activeOrders: clientOrders.filter(o => activeStatuses.includes(o.status)).length,
          totalRevenue,
          depositsPaid,
          refundsIssued,
          outstandingBalance,
          lastOrderDate: clientOrders.length > 0 ? clientOrders[0].created_at : null,
        };
      });

      setClients(clientSummaries);
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.profile.company_name?.toLowerCase().includes(q) ||
      c.profile.full_name.toLowerCase().includes(q) ||
      c.profile.email.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const totals = useMemo(() => {
    return {
      totalClients: clients.length,
      totalOrders: clients.reduce((sum, c) => sum + c.totalOrders, 0),
      totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalDeposits: clients.reduce((sum, c) => sum + c.depositsPaid, 0),
    };
  }, [clients]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage all client relationships, orders, and financials.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Clients</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.totalClients}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.totalOrders}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Deposits Received</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${totals.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardBody>
            <Input
              placeholder="Search by company name, contact name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* Client List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              All Clients ({filteredClients.length})
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {clients.length === 0 ? 'No clients yet.' : 'No clients match your search.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <Link
                    key={client.profile.id}
                    href={`/admin/clients/${client.profile.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {client.profile.company_name?.charAt(0) || client.profile.full_name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {client.profile.company_name || client.profile.full_name}
                        </p>
                        {client.activeOrders > 0 && (
                          <Badge variant="info">{client.activeOrders} active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {client.profile.full_name} · {client.profile.email}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Orders</p>
                        <p className="font-semibold text-gray-900">{client.totalOrders}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Revenue</p>
                        <p className="font-semibold text-gray-900">
                          ${client.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Deposits</p>
                        <p className="font-semibold text-green-600">
                          ${client.depositsPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Last Order</p>
                        <p className="text-sm text-gray-600">
                          {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
