'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Send, FileText, Paperclip, Truck, MapPin, Star, Plane, Ship, DollarSign, CheckCircle, CreditCard, XCircle } from 'lucide-react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { StatusTimeline, TimelineStep } from '@/components/ui/StatusTimeline';
import { createClient } from '@/lib/supabase';
import { ORDER_STATUS_LABELS, ORDER_TIMELINE } from '@/lib/constants';
import { Order, OrderUpdate, OrderMessage, OrderSpecification, User, OrderShipment, DeliveryAddress } from '@/types';

const getStatusVariant = (status: string) => {
  if (['delivered', 'sample_approved'].includes(status)) return 'success';
  if (['action_required', 'cancelled'].includes(status)) return 'error';
  if (['sample_approval_pending', 'action_required'].includes(status))
    return 'warning';
  return 'info';
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const paymentStatus = searchParams.get('payment');

  const [user, setUser] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [updates, setUpdates] = useState<OrderUpdate[]>([]);
  const [allMessages, setAllMessages] = useState<OrderMessage[]>([]);
  const [specifications, setSpecifications] = useState<OrderSpecification | null>(null);
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newMessage, setNewMessage] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [changesLoading, setChangesLoading] = useState(false);
  const [selectedQuoteOption, setSelectedQuoteOption] = useState<'air' | 'ocean' | null>(null);
  const [changingQuote, setChangingQuote] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setUser(profileData as User);
        }

        // Fetch order for this client
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('client_id', authUser.id)
          .single();

        if (orderError || !orderData) {
          setOrder(null);
          setIsLoading(false);
          return;
        }

        setOrder(orderData as Order);

        // Fetch updates
        const { data: updatesData } = await supabase
          .from('order_updates')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false });

        setUpdates((updatesData as OrderUpdate[]) || []);

        // Fetch messages
        const { data: messagesData } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });

        setAllMessages((messagesData as OrderMessage[]) || []);

        // Fetch specification
        const { data: specData } = await supabase
          .from('order_specifications')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (specData) {
          setSpecifications(specData as OrderSpecification);
        }

        // Fetch shipments with delivery addresses
        const { data: shipmentsData } = await supabase
          .from('order_shipments')
          .select('*, delivery_address:delivery_addresses(*)')
          .eq('order_id', orderId);

        if (shipmentsData) {
          setShipments(shipmentsData.map((s: any) => ({
            ...s,
            delivery_address: s.delivery_address || undefined,
          })));
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <PortalLayout pageTitle="Loading...">
        <Card>
          <CardBody className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Loading order...
            </h2>
          </CardBody>
        </Card>
      </PortalLayout>
    );
  }

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const supabase = createClient();
    const newMsg: OrderMessage = {
      id: `msg_${Date.now()}`,
      order_id: orderId,
      sender_id: user.id,
      sender_role: 'client',
      message: newMessage,
      attachments: [],
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('order_messages').insert([{
      order_id: orderId,
      sender_id: user.id,
      sender_role: 'client',
      message: newMessage,
      attachments: [],
    }]);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setAllMessages([...allMessages, newMsg]);
    setNewMessage('');
  };

  const handleApproval = async (approved: boolean) => {
    if (!user) return;
    const supabase = createClient();

    if (approved) {
      setApprovalLoading(true);
      try {
        // Update order status to sample_approved
        await supabase
          .from('orders')
          .update({ status: 'sample_approved' })
          .eq('id', orderId);

        // Add an update record
        await supabase.from('order_updates').insert([{
          order_id: orderId,
          status: 'sample_approved',
          message: 'Client approved the samples.',
          updated_by: user.id,
        }]);

        // Send approval message
        const approvalMsg = 'I approve the samples. Please proceed with manufacturing.';
        await supabase.from('order_messages').insert([{
          order_id: orderId,
          sender_id: user.id,
          sender_role: 'client',
          message: approvalMsg,
          attachments: [],
        }]);

        const response: OrderMessage = {
          id: `msg_${Date.now()}`,
          order_id: orderId,
          sender_id: user.id,
          sender_role: 'client',
          message: approvalMsg,
          attachments: [],
          created_at: new Date().toISOString(),
        };
        setAllMessages([...allMessages, response]);
        setOrder({ ...order!, status: 'sample_approved' });
      } catch (error) {
        console.error('Error approving sample:', error);
      } finally {
        setApprovalLoading(false);
      }
    } else {
      setChangesLoading(true);
      try {
        // Update order status to action_required
        await supabase
          .from('orders')
          .update({ status: 'action_required' })
          .eq('id', orderId);

        await supabase.from('order_updates').insert([{
          order_id: orderId,
          status: 'action_required',
          message: 'Client requested changes to samples.',
          updated_by: user.id,
        }]);
      } catch (error) {
        console.error('Error requesting changes:', error);
      } finally {
        setChangesLoading(false);
      }
    }
  };

  const handleSelectShipping = async () => {
    if (!selectedQuoteOption || !user || !order) return;
    setQuoteLoading(true);

    try {
      const supabase = createClient();
      const pricePerUnit = selectedQuoteOption === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit;
      const totalAmount = (pricePerUnit || 0) * order.quantity;
      const depositAmount = totalAmount * 0.3;

      await supabase.from('orders').update({
        selected_shipping: selectedQuoteOption,
        selected_shipping_at: new Date().toISOString(),
        deposit_amount: depositAmount,
        status: 'deposit_required',
      }).eq('id', orderId);

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'deposit_required',
        message: `Client selected DDP ${selectedQuoteOption === 'air' ? 'Air' : 'Ocean'} Freight at $${pricePerUnit?.toFixed(2)}/unit. 30% deposit of $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} required.`,
        updated_by: user.id,
      }]);

      await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: user.id,
        sender_role: 'client',
        message: `I'd like to go with the DDP ${selectedQuoteOption === 'air' ? 'Air' : 'Ocean'} Freight option at $${pricePerUnit?.toFixed(2)}/unit.`,
        attachments: [],
      }]);

      setOrder({
        ...order,
        selected_shipping: selectedQuoteOption,
        deposit_amount: depositAmount,
        status: 'deposit_required' as any,
      });
      setChangingQuote(false);
    } catch (error) {
      console.error('Error selecting shipping:', error);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!order || !user) return;
    setPaymentLoading(true);

    try {
      // Create Stripe checkout session via API
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number || order.id.slice(0, 8),
          amount: order.deposit_amount,
          customerEmail: user.email,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <PortalLayout
      pageTitle={`Order #${order.order_number || order.id.slice(0, 8)}`}
      userId={user?.id}
      userName={user?.full_name || 'User'}
      userEmail={user?.email || ''}
      companyName={user?.company_name || ''}
    >
      <div className="space-y-6">
        {/* Payment Status Banner */}
        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-700">Your deposit has been received. We&apos;ll begin processing your order right away.</p>
            </div>
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Payment Cancelled</p>
              <p className="text-sm text-yellow-700">You can complete the deposit payment at any time using the button below.</p>
            </div>
          </div>
        )}

        {/* Cancellation Banner */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-800 text-lg">Order Cancelled</h3>
                {order.cancellation_reason && (
                  <p className="text-red-700 mt-1"><span className="font-medium">Reason:</span> {order.cancellation_reason}</p>
                )}
                {order.cancelled_at && (
                  <p className="text-red-600 text-sm mt-1">Cancelled on {new Date(order.cancelled_at).toLocaleString()}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">If you have questions about this cancellation, please use the message thread below.</p>
              </div>
            </div>

            {/* Refund Status */}
            {order.refund_issued && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">
                    Refund of ${order.refund_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} Issued
                  </p>
                  {order.refund_issued_at && (
                    <p className="text-sm text-green-700">Issued on {new Date(order.refund_issued_at).toLocaleString()}</p>
                  )}
                  <p className="text-sm text-green-700 mt-1">Please allow 5–10 business days for the refund to appear in your account.</p>
                </div>
              </div>
            )}
            {order.deposit_paid && !order.refund_issued && (
              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">Deposit of ${order.deposit_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} on file</p>
                  <p className="text-sm text-yellow-700">Our team is reviewing the refund for your deposit. If you have questions, please message us below.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Header */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Order #{order.order_number || order.id.slice(0, 8)}
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
                  {order.target_price ? `$${order.target_price.toFixed(2)}` : 'Not specified'}
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

        {/* Delivery Information */}
        {shipments.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                Delivery Information
              </h2>
            </CardHeader>
            <CardBody>
              {shipments.length === 1 ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {shipments[0].delivery_address?.label || 'Delivery Address'}
                    </p>
                    {shipments[0].delivery_address && (
                      <>
                        <p className="text-sm text-gray-600">
                          {shipments[0].delivery_address.address_line1}
                          {shipments[0].delivery_address.address_line2 ? `, ${shipments[0].delivery_address.address_line2}` : ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shipments[0].delivery_address.city}, {shipments[0].delivery_address.state} {shipments[0].delivery_address.zip_code}
                        </p>
                        <p className="text-sm text-gray-500">{shipments[0].delivery_address.country}</p>
                      </>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {shipments[0].quantity.toLocaleString()} units
                    </p>
                    {shipments[0].notes && (
                      <p className="text-sm text-gray-400 mt-1">Note: {shipments[0].notes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-2">
                    This order is split across {shipments.length} delivery locations:
                  </p>
                  {shipments.map((shipment, idx) => (
                    <div
                      key={shipment.id}
                      className="flex items-start gap-3 border border-gray-200 rounded-xl p-4"
                    >
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 text-sm">
                            {shipment.delivery_address?.label || `Shipment ${idx + 1}`}
                          </p>
                          <Badge variant="info">
                            {shipment.quantity.toLocaleString()} units
                          </Badge>
                        </div>
                        {shipment.delivery_address && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            {shipment.delivery_address.address_line1}, {shipment.delivery_address.city}, {shipment.delivery_address.state} {shipment.delivery_address.zip_code}
                          </p>
                        )}
                        {shipment.notes && (
                          <p className="text-xs text-gray-400 mt-1">Note: {shipment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

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

        {/* Quote Review & Selection */}
        {(order.status === 'quote_ready' || changingQuote) && order.quote_air_price_per_unit && order.quote_ocean_price_per_unit && (
          <Card className="border-2 border-yellow-300 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-bold text-gray-900">Your Quote is Ready</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                We've sourced your product and have two shipping options. Please select your preferred option to proceed.
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Air Freight Option */}
                <button
                  onClick={() => setSelectedQuoteOption('air')}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    selectedQuoteOption === 'air'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Plane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">DDP Air Freight</h3>
                    {selectedQuoteOption === 'air' && <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price per unit</span>
                      <span className="font-bold text-gray-900">${order.quote_air_price_per_unit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Production time</span>
                      <span className="font-semibold text-gray-900">{order.quote_air_production_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping time</span>
                      <span className="font-semibold text-gray-900">{order.quote_air_shipping_days} days</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Total lead time</span>
                      <span>{order.quote_air_lead_days} days</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total ({order.quantity.toLocaleString()} units)</span>
                        <span className="font-bold text-lg text-blue-600">
                          ${(order.quote_air_price_per_unit * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Ocean Freight Option */}
                <button
                  onClick={() => setSelectedQuoteOption('ocean')}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    selectedQuoteOption === 'ocean'
                      ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200'
                      : 'border-gray-200 bg-white hover:border-cyan-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Ship className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-bold text-gray-900">DDP Ocean Freight</h3>
                    {selectedQuoteOption === 'ocean' && <CheckCircle className="w-5 h-5 text-cyan-500 ml-auto" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price per unit</span>
                      <span className="font-bold text-gray-900">${order.quote_ocean_price_per_unit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Production time</span>
                      <span className="font-semibold text-gray-900">{order.quote_ocean_production_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping time</span>
                      <span className="font-semibold text-gray-900">{order.quote_ocean_shipping_days} days</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Total lead time</span>
                      <span>{order.quote_ocean_lead_days} days</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total ({order.quantity.toLocaleString()} units)</span>
                        <span className="font-bold text-lg text-cyan-600">
                          ${(order.quote_ocean_price_per_unit * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {selectedQuoteOption && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    After confirming, a <span className="font-bold">30% deposit</span> of{' '}
                    <span className="font-bold text-gray-900">
                      ${(((selectedQuoteOption === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit) || 0) * order.quantity * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>{' '}
                    will be required to proceed.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleSelectShipping}
                    isLoading={quoteLoading}
                    className="w-full"
                  >
                    Confirm {selectedQuoteOption === 'air' ? 'Air' : 'Ocean'} Freight
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Selected Quote Summary (visible after selection, hidden while changing) */}
        {order.selected_shipping && !changingQuote && (
          <Card className="border border-green-200">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${order.selected_shipping === 'air' ? 'bg-blue-100' : 'bg-cyan-100'}`}>
                  {order.selected_shipping === 'air' ? <Plane className="w-5 h-5 text-blue-600" /> : <Ship className="w-5 h-5 text-cyan-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    DDP {order.selected_shipping === 'air' ? 'Air' : 'Ocean'} Freight Selected
                  </p>
                  <p className="text-sm text-gray-600">
                    ${(order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit)?.toFixed(2)}/unit
                    · Production: {order.selected_shipping === 'air' ? order.quote_air_production_days : order.quote_ocean_production_days}d
                    · Shipping: {order.selected_shipping === 'air' ? order.quote_air_shipping_days : order.quote_ocean_shipping_days}d
                    · Total: {order.selected_shipping === 'air' ? order.quote_air_lead_days : order.quote_ocean_lead_days} days
                  </p>
                </div>
                {order.deposit_paid ? (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" /> Deposit Paid
                  </Badge>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedQuoteOption(order.selected_shipping as 'air' | 'ocean');
                      setChangingQuote(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                  >
                    Change
                  </button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Deposit Payment Required */}
        {order.status === 'deposit_required' && order.deposit_amount && (
          <Card className="border-2 border-orange-300 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">30% Deposit Required</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="bg-white rounded-lg p-5 border border-orange-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Order Total</span>
                  <span className="font-semibold text-gray-900">
                    ${(((order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit) || 0) * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">30% Deposit Due</span>
                  <span className="font-bold text-2xl text-orange-600">
                    ${order.deposit_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Pay securely via credit card, ACH transfer, or wire transfer. Your order will be confirmed immediately upon payment.
              </p>
              <Button
                variant="primary"
                onClick={handlePayDeposit}
                isLoading={paymentLoading}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Deposit — ${order.deposit_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Powered by Stripe. Accepts credit card, ACH, and wire transfers.
              </p>
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
