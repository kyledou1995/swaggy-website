'use client';

import React, { useMemo, useState } from 'react';
import { Send, FileText, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import {
  DEMO_ORDERS,
  DEMO_UPDATES,
  DEMO_MESSAGES,
  DEMO_SPECIFICATIONS,
  DEMO_ADMIN,
} from '@/lib/demo-data';
import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE,
  PRODUCT_TYPES,
} from '@/lib/constants';
import { OrderStatus } from '@/types';
import Link from 'next/link';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  const order = useMemo(
    () => DEMO_ORDERS.find((o) => o.id === orderId),
    [orderId]
  );

  const updates = useMemo(
    () =>
      DEMO_UPDATES.filter((u) => u.order_id === orderId).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [orderId]
  );

  const messages = useMemo(
    () =>
      DEMO_MESSAGES.filter((m) => m.order_id === orderId).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [orderId]
  );

  const specification = useMemo(
    () => DEMO_SPECIFICATIONS.find((s) => s.order_id === orderId),
    [orderId]
  );

  const currentStatusIndex = useMemo(
    () => (order ? ORDER_TIMELINE.indexOf(order.status) : -1),
    [order]
  );

  const handleStatusUpdate = async () => {
    if (!newStatus || !updateMessage.trim()) {
      alert('Please select a status and enter a message');
      return;
    }

    setIsLoadingStatus(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoadingStatus(false);

    alert(
      `Status updated to "${ORDER_STATUS_LABELS[newStatus]}" with message: "${updateMessage}"`
    );
    setNewStatus('');
    setUpdateMessage('');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsLoadingMessage(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsLoadingMessage(false);

    alert(`Message sent: "${messageText}"`);
    setMessageText('');
  };

  const handleRequestInfo = async () => {
    setIsLoadingStatus(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoadingStatus(false);

    alert('Information request sent to client');
    setNewStatus('');
    setUpdateMessage('');
  };

  const handleSendSample = async () => {
    setIsLoadingStatus(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoadingStatus(false);

    alert('Sample approval request sent to client');
    setNewStatus('');
    setUpdateMessage('');
  };

  const handleRequestPayment = async () => {
    setIsLoadingStatus(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoadingStatus(false);

    alert('Payment request sent to client');
    setNewStatus('');
    setUpdateMessage('');
  };

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
          <p className="text-gray-600 mt-2">
            The order you're looking for doesn't exist.
          </p>
          <Link href="/admin/orders">
            <Button variant="primary" className="mt-4">
              Back to Orders
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900">Order {order.id}</h1>
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
                {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
              </Badge>
            </div>
            <p className="text-gray-600 mt-2">
              Created on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <Link href="/admin/orders">
            <Button variant="secondary" size="md">
              Back to Orders
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Product Type</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {order.product_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Quantity</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {order.quantity.toLocaleString()} units
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Target Price</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      ${order.target_price.toFixed(2)} per unit
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Target Delivery Date
                    </p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {new Date(order.target_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 font-medium">Description</p>
                    <p className="text-base text-gray-900 mt-1">
                      {order.product_description}
                    </p>
                  </div>
                  {order.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 font-medium">Notes</p>
                      <p className="text-base text-gray-900 mt-1">{order.notes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
              </CardHeader>
              <CardBody>
                <StatusTimeline
                  steps={ORDER_TIMELINE.map((status) => ({
                    id: status,
                    label: ORDER_STATUS_LABELS[status],
                  }))}
                  currentStepIndex={currentStatusIndex}
                />
              </CardBody>
            </Card>

            {/* Update Status Section */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  Update Order Status
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  label="Select New Status"
                  options={ORDER_TIMELINE.map((status) => ({
                    value: status,
                    label: ORDER_STATUS_LABELS[status],
                  }))}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                />
                <Textarea
                  label="Status Update Message"
                  placeholder="Provide details about this status update..."
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  helperText="This message will be sent to the client"
                  rows={4}
                />
                <Button
                  variant="primary"
                  onClick={handleStatusUpdate}
                  isLoading={isLoadingStatus}
                  className="w-full"
                >
                  Update Status
                </Button>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleRequestInfo}
                    isLoading={isLoadingStatus}
                    className="w-full"
                  >
                    Request Information
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleSendSample}
                    isLoading={isLoadingStatus}
                    className="w-full"
                  >
                    Send for Sample Approval
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRequestPayment}
                    isLoading={isLoadingStatus}
                    className="w-full"
                  >
                    Request Payment
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Specifications */}
            {specification && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Order Specifications
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Materials</p>
                      <p className="text-base text-gray-900 mt-1">
                        {specification.materials}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Colors</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {specification.colors.map((color) => (
                          <Badge key={color} variant="neutral">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Logo Placement
                      </p>
                      <p className="text-base text-gray-900 mt-1">
                        {specification.logo_placement}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Packaging Requirements
                      </p>
                      <p className="text-base text-gray-900 mt-1">
                        {specification.packaging_requirements}
                      </p>
                    </div>
                    {specification.certifications.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Certifications
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {specification.certifications.map((cert) => (
                            <Badge key={cert} variant="success">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {Object.keys(specification.additional_specs).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Additional Specs
                        </p>
                        <div className="mt-2 space-y-2">
                          {Object.entries(specification.additional_specs).map(
                            ([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-sm text-gray-600 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {value}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Client Info</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                      T
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        TechStartup Inc
                      </p>
                      <p className="text-sm text-gray-600">
                        john@techstartup.com
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  Update History
                </h2>
              </CardHeader>
              <CardBody>
                {updates.length === 0 ? (
                  <p className="text-sm text-gray-500">No updates yet</p>
                ) : (
                  <div className="space-y-3">
                    {updates.slice(0, 3).map((update) => (
                      <div key={update.id} className="border-l-2 border-green-500 pl-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">
                              {ORDER_STATUS_LABELS[update.status]}
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
                            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {update.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Communication Thread */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Communication Thread
            </h2>
          </CardHeader>
          <CardBody>
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {messages.map((message) => {
                  const isAdmin = message.sender_role === 'admin';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          isAdmin
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className={`text-xs font-semibold mb-1 ${
                          isAdmin ? 'text-green-100' : 'text-gray-600'
                        }`}>
                          {isAdmin ? DEMO_ADMIN.full_name : 'Client'}
                        </p>
                        <p className="text-sm">{message.message}</p>
                        {message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment}
                                className="flex items-center gap-1 text-xs mt-1"
                              >
                                <FileText size={14} />
                                {attachment}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${
                          isAdmin ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleDateString()} at{' '}
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>

          {/* Message Input */}
          <CardFooter className="flex gap-3">
            <Textarea
              placeholder="Send a message to the client..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={2}
            />
            <Button
              variant="primary"
              onClick={handleSendMessage}
              isLoading={isLoadingMessage}
              className="flex-shrink-0"
              disabled={!messageText.trim()}
            >
              <Send size={18} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
