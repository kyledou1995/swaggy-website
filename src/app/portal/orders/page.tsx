'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Filter, Package } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ORDER_STATUS_LABELS, PRODUCT_TYPES } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Order } from '@/types';

const getStatusVariant = (status: string) => {
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending'].includes(status)) return 'warning';
  return 'info';
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');

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

      setOrders(userOrders || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        (order.order_number || order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesProduct = !productFilter || order.product_type === productFilter;
      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [orders, searchTerm, statusFilter, productFilter]);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => ({ value: key, label })),
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
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">Track and manage all your orders</p>
          </div>
          <Link href="/portal/orders/new">
            <Button variant="primary">New Order</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-8">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" />
              <Select options={productOptions} value={productFilter} onChange={(e) => setProductFilter(e.target.value)} label="Product Type" />
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card>
          <CardBody>
            <div className="text-center py-12 text-gray-500">Loading orders...</div>
          </CardBody>
        </Card>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order: Order) => (
            <Card key={order.id} hover>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {order.order_number || `Order ${order.id.substring(0, 8)}`}
                      </h3>
                      <Badge variant={getStatusVariant(order.status) as any}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{order.product_type}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Quantity</p>
                        <p className="font-semibold text-gray-900">{order.quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Target Price</p>
                        <p className="font-semibold text-gray-900">${order.target_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Delivery Date</p>
                        <p className="font-semibold text-gray-900">{new Date(order.target_delivery_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Created</p>
                        <p className="font-semibold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <Link href={`/portal/orders/${order.id}`}>
                    <Button variant="primary" size="md">View Details</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0
                  ? "You haven't placed any orders yet. Create your first one!"
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
