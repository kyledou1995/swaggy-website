'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Send, FileText, Paperclip } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { StatusTimeline, TimelineStep } from '@/components/ui/StatusTimeline';
import {
  DEMO_ORDERS,
  DEMO_UPDATES,
  DEMO_MESSAGES,
  DEMO_SPECIFICATIONS,
  DEMO_USER,
  DEMO_ADMIN,
} from '@/lib/demo-data';
import { ORDER_STATUS_LABELS, ORDER_TIMELINE } from '@/lib/constants';
import { Order } from '@/types';

const getStatusVariant = (status: string) => {
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending', 'action_required'].includes(status))
    return 'warning';
  return 'info';
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const order = DEMO_ORDERS.find((o) => o.id === orderId);
  const updates = DEMO_UPDATES.filter((u) => u.order_id === orderId);
  const messages = DEMO_MESSAGES.filter((m) => m.order_id === orderId);
  const specifications = DEMO_SPECIFICATIONS.find(
    (s) => s.order_id === orderId
  );

  const [newMessage, setNewMessage] = useState('');
  const [allMessages, setAllMessages] = useState(messages);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [changesLoading, setChangesLoading] = useState(false);

  if (!order) {
    return (
      <PortalLayout pageTitle="Order Not Found">
        <Card>
          <CardBody className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order not found
            </h2>
            <p className="text-gray-600">
              The order you're looking for doesn't exist.
            </p>
          </CardBody>
        </Card>
      </PortalLayout>
    );
  }

  const currentStepIndex = ORDER_TIMELINE.indexOf(order.status);

  const timelineSteps: TimelineStep[] = ORDER_TIMELINE.map((status) => {
    const statusLabel = ORDER_STATUS_LABELS[status];
    const update = updates.find((u) => u.status === status);
    return {
      id: status,
      label: statusLabel,
      timestamp: update
        ? new Date(update.created_at).toLocaleDateString()
        : undefined,
      message: update?.message,
    };
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: `msg_${allMessages.length + 1}`,
      order_id: orderId,
      sender_id: DEMO_USER.id,
      sender_role: 'client' as const,
      message: newMessage,
      attachments: [],
      created_at: new Date().toISOString(),
    };

    setAllMessages([...allMessages, newMsg]);
    setNewMessage('');
  };

  const handleApproval = async (approved: boolean) => {
    if (approved) {
      setApprovalLoading(true);
      setTimeout(() => {
        setApprovalLoading(false);
        const response = {
          id: `msg_${allMessages.length + 1}`,
          order_id: orderId,
          sender_id: DEMO_USER.id,
          sender_role: 'client' as const,
          message:
            'I approve the samples. Please proceed with manufacturing.',
          attachments: [],
          created_at: new Date().toISOString(),
        };
        setAllMessages([...allMessages, response]);
      }, 1000);
    } else {
      setChangesLoading(true);
      setTimeout(() => {
        setChangesLoading(false);
      }, 1000);
    }
  };

  return (
    <PortalLayout
      pageTitle={`Order #${order.id.split('_')[1]}`}
      userName={DEMO_USER.full_name}
      userEmail={DEMO_USER.email}
      companyName={DEMO_USER.company_name}
    >
      <div className="space-y-6">
        {/* Order Header */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Order #{order.id.split('_')[1]}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusVariant(order.status) as any}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Created{' '}
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">
              Order Progress
            </h2>
          </CardHeader>
          <CardBody>
            <StatusTimeline
              steps={timelineSteps}
              currentStepIndex={currentStepIndex}
            />
          </CardBody>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">
              Order Details
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Product Type</p>
                <p className="font-semibold text-gray-900">
                  {order.product_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="font-semibold text-gray-900">
                  {order.quantity.toLocaleString()} units
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Target Unit Price
                </p>
                <p className="font-semibold text-gray-900">
                  ${order.target_price.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Target Delivery Date
                </p>
                <p className="font-semibold text-gray-900">
                  {new Date(order.target_delivery_date).toLocaleDateString()}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">
                  Product Description
                </p>
                <p className="text-gray-900">
                  {order.product_description}
                </p>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-900">{order.notes}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Specifications */}
        {specifications && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900">
                Specifications
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Materials</p>
                  <p className="font-semibold text-gray-900">
                    {specifications.materials}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Colors</p>
                  <p className="font-semibold text-gray-900">
                    {specifications.colors.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Logo Placement
                  </p>
                  <p className="font-semibold text-gray-900">
                    {specifications.logo_placement}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Certifications
                  </p>
                  <p className="font-semibold text-gray-900">
                    {specifications.certifications.join(', ')}
                  </p>
                </div>
                {specifications.packaging_requirements && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">
                      Packaging Requirements
                    </p>
                    <p className="text-gray-900">
                      {specifications.packaging_requirements}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Sample Approval */}
        {order.status === 'sample_approval_pending' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900">
                Sample Approval Required
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700 mb-4">
                We've sent you sample items for approval. Please review them and
                confirm whether you'd like to proceed with manufacturing.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Please respond within 3 business days to avoid delays in your
                  order.
                </p>
              </div>
            </CardBody>
            <CardFooter>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  isLoading={approvalLoading}
                  onClick={() => handleApproval(true)}
                >
                  Approve Sample
                </Button>
                <Button
                  variant="secondary"
                  isLoading={changesLoading}
                  onClick={() => handleApproval(false)}
                >
                  Request Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Action Required */}
        {order.status === 'action_required' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900 text-red-600">
                Action Required
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">
                We need additional information from you to proceed with this
                order. Please check the messages section below and respond as
                soon as possible.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Messages */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">
              Messages ({allMessages.length})
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pb-4">
              {allMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No messages yet. Start a conversation by sending a message
                  below.
                </p>
              ) : (
                allMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender_role === 'admin'
                        ? 'flex-row'
                        : 'flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender_role === 'admin'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {msg.sender_role === 'admin' ? 'S' : 'Y'}
                      </span>
                    </div>
                    <div
                      className={`flex-1 ${
                        msg.sender_role === 'admin'
                          ? 'items-start'
                          : 'items-end'
                      }`}
                    >
                      <div
                        className={`rounded-lg p-3 ${
                          msg.sender_role === 'admin'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-green-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-3">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>

          <CardFooter>
            <div className="w-full space-y-3">
              <Textarea
                placeholder="Type your message..."
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex gap-3">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach File
                </Button>
                <div className="flex-1" />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
}
