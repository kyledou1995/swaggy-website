'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DEMO_ORDERS, DEMO_USER } from '@/lib/demo-data';
import { ORDER_STATUS_LABELS, PRODUCT_TYPES } from '@/lib/constants';
import { Order, OrderStatus } from '@/types';

const getStatusVariant = (status: string) => {
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending', 'action_required'].includes(status))
    return 'warning';
  return 'info';
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');

  const filteredOrders = useMemo(() => {
    return DEMO_ORDERS.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesProduct =
        !productFilter || order.product_type === productFilter;

      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [searchTerm, statusFilter, productFilter]);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => ({
      value: key,
      label,
    })),
  ];

  const productOptions = [
    { value: '', label: 'All Products' },
    ...PRODUCT_TYPES.map((type) => ({
      value: type,
      label: type,
    })),
  ];

  return (
    <PortalLayout
      pageTitle="My Orders"
      userName={DEMO_USER.full_name}
      userEmail={DEMO_USER.email}
      companyName={DEMO_USER.company_name}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">
              Track and manage all your orders
            </p>
          </div>
          <Link href="/portal/orders/new">
            <Button variant="primary">New Order</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Status Filter */}
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              />

              {/* Product Type Filter */}
              <Select
                options={productOptions}
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                label="Product Type"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Orders Grid/List */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order: Order) => (
            <Card key={order.id} hover>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.id.split('_')[1]}
                      </h3>
                      <Badge variant={getStatusVariant(order.status) as any}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{order.product_type}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Quantity</p>
                        <p className="font-semibold text-gray-900">
                          {order.quantity.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Target Price</p>
                        <p className="font-semibold text-gray-900">
                          ${order.target_price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Delivery Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(order.target_delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Created</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <Link href={`/portal/orders/${order.id}`}>
                    <Button variant="primary" size="md">
                      View Details
                    </Button>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or create a new order.
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
