'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DDPTerm } from '@/components/ui/DDPTerm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, FileEdit, Filter, Package } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ORDER_STATUS_LABELS, PRODUCT_TYPES } from '@/lib/constants';
import { OrderFlags, useUnreadOrderIds } from '@/components/portal/OrderWhatsNew';
import { createClient } from '@/lib/supabase';
import { Skeleton, stagger } from '@/components/ui/Animated';
import { Order } from '@/types';

const getStatusVariant = (status: string) => {
  if (status === 'draft') return 'neutral';
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending'].includes(status)) return 'warning';
  return 'info';
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userId, setUserId] = useState('');
  const unreadOrderIds = useUnreadOrderIds(userId || undefined);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [tab, setTab] = useState<'active' | 'drafts' | 'archived'>('active');
  /** Latest activity per order: status updates, messages, or edits to the order. */
  const [lastActivity, setLastActivity] = useState<Record<string, string>>({});

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
      } else {
        setUserName(user.user_metadata?.full_name || user.email || '');
        setUserEmail(user.email || '');
        setCompanyName(user.user_metadata?.company_name || '');
      }

      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      const list = (userOrders || []) as Order[];
      setOrders(list);

      // Most recent activity per order (status updates + messages + order edits)
      const ids = list.map((o) => o.id);
      const latest: Record<string, string> = {};
      const bump = (id: string, at?: string | null) => {
        if (at && (!latest[id] || at > latest[id])) latest[id] = at;
      };
      list.forEach((o) => {
        bump(o.id, o.updated_at ? new Date(o.updated_at).toISOString() : null);
        bump(o.id, new Date(o.created_at).toISOString());
      });
      if (ids.length) {
        const [upd, msgs] = await Promise.all([
          supabase.from('order_updates').select('order_id, created_at').in('order_id', ids),
          supabase.from('order_messages').select('order_id, created_at').in('order_id', ids),
        ]);
        [...(upd.data || []), ...(msgs.data || [])].forEach((r: { order_id: string; created_at: string }) =>
          bump(r.order_id, new Date(r.created_at).toISOString())
        );
      }
      setLastActivity(latest);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const tabOf = (o: Order): 'active' | 'drafts' | 'archived' =>
    o.status === 'cancelled' ? 'archived' : o.status === 'draft' ? 'drafts' : 'active';
  const activeCount = orders.filter((o) => tabOf(o) === 'active').length;
  const draftCount = orders.filter((o) => tabOf(o) === 'drafts').length;
  const archivedCount = orders.filter((o) => tabOf(o) === 'archived').length;

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return orders
      .filter((order) => {
        if (tabOf(order) !== tab) return false;
        const matchesSearch =
          (order.order_number || order.id).toLowerCase().includes(term) ||
          (order.product_description || '').toLowerCase().includes(term) ||
          (order.product_type || '').toLowerCase().includes(term);
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesProduct = !productFilter || order.product_type === productFilter;
        return matchesSearch && matchesStatus && matchesProduct;
      })
      // Most recently updated first
      .sort((a, b) => (lastActivity[b.id] || b.created_at).localeCompare(lastActivity[a.id] || a.created_at));
  }, [orders, searchTerm, statusFilter, productFilter, tab, lastActivity]);

  const updatedAgo = (iso?: string) => {
    if (!iso) return '';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString();
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(ORDER_STATUS_LABELS)
      .filter(([key]) => (tab === 'archived' ? key === 'cancelled' : tab === 'drafts' ? key === 'draft' : key !== 'cancelled' && key !== 'draft'))
      .map(([key, label]) => ({ value: key, label })),
  ];

  const productOptions = [
    { value: '', label: 'All Products' },
    ...PRODUCT_TYPES.map((type) => ({ value: type, label: type })),
  ];

  return (
    <PortalLayout
      pageTitle="My Orders"
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      companyName={companyName}
    >
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">Track and manage all your orders</p>
          </div>
          <Link href="/portal/orders/new">
            <Button variant="primary">New Order</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {([
          ['active', 'Active', activeCount],
          ['drafts', 'Drafts', draftCount],
          ['archived', 'Archived', archivedCount],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setStatusFilter('');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {key === 'archived' && <Archive className="w-4 h-4" />}
            {key === 'drafts' && <FileEdit className="w-4 h-4" />}
            {label}
            <span className={`text-xs rounded-full px-2 py-0.5 ${tab === key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
          </button>
        ))}
      </div>
      {tab === 'archived' && (
        <p className="text-sm text-gray-500 mb-4">Cancelled orders are kept here for your records.</p>
      )}
      {tab === 'drafts' && (
        <p className="text-sm text-gray-500 mb-4">Orders you started but haven&apos;t submitted yet. Pick up where you left off anytime.</p>
      )}

      <Card className="mb-8">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input label="Search" placeholder="Order #, product, description…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" />
              <Select options={productOptions} value={productFilter} onChange={(e) => setProductFilter(e.target.value)} label="Product Type" />
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((k) => (
                    <div key={k} className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order: Order, i) => (
            <div key={order.id} className="animate-fade-up" style={stagger(Math.min(i, 8))}>
            <Card hover>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">
                        {order.order_number || `Order ${order.id.substring(0, 8)}`}
                      </h3>
                      <Badge variant={getStatusVariant(order.status) as any}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                      <OrderFlags order={order} hasUpdate={unreadOrderIds.has(order.id)} />
                      {lastActivity[order.id] && (
                        <span className="text-xs text-gray-400 sm:ml-auto">Updated {updatedAgo(lastActivity[order.id])}</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{order.product_type}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Quantity</p>
                        <p className="font-semibold text-gray-900">{order.quantity ? order.quantity.toLocaleString() : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Target Price (<DDPTerm />)</p>
                        <p className="font-semibold text-gray-900">{order.target_price ? `$${order.target_price.toFixed(2)}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Delivery Date</p>
                        <p className="font-semibold text-gray-900">{order.target_delivery_date ? new Date(order.target_delivery_date).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Created</p>
                        <p className="font-semibold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={order.status === 'draft' ? `/portal/orders/new?draft=${order.id}` : `/portal/orders/${order.id}`}
                    className="w-full md:w-auto"
                  >
                    <Button variant={order.status === 'draft' ? 'secondary' : 'primary'} size="md" className="w-full md:w-auto">
                      {order.status === 'draft' ? 'Continue Draft' : 'View Details'}
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tab === 'archived' && archivedCount === 0
                  ? 'No archived orders'
                  : tab === 'drafts' && draftCount === 0
                    ? 'No drafts'
                    : 'No orders found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0
                  ? "You haven't placed any orders yet. Create your first one!"
                  : tab === 'archived' && archivedCount === 0
                    ? 'Cancelled orders will appear here.'
                    : tab === 'drafts' && draftCount === 0
                      ? 'Unfinished orders are saved here automatically.'
                    : tab === 'active' && activeCount === 0
                      ? 'You have no active orders right now.'
                      : 'Try adjusting your filters.'}
              </p>
              <Link href="/portal/orders/new">
                <Button variant="primary">Create New Order</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </PortalLayout>
  );
}
