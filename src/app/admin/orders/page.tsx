'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DEMO_ORDERS } from '@/lib/demo-data';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/constants';
import Link from 'next/link';
import { OrderStatus } from '@/types';

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = useMemo(() => {
    return DEMO_ORDERS.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product_description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all client orders in one place.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by order ID or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="md:w-64">
                <Select
                  label="Filter by Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Orders ({filteredOrders.length})
              </h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No orders found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {order.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.product_type}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {order.product_description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">
                            {order.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              order.status === 'delivered'
                                ? 'success'
                                : order.status === 'action_required'
                                ? 'error'
                                : order.status === 'sample_approval_pending'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {
                              ORDER_STATUS_LABELS[
                                order.status as keyof typeof ORDER_STATUS_LABELS
                              ]
                            }
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="primary" size="sm">
                              Manage
                            </Button>
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
