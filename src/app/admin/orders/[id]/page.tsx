'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Send, FileText, AlertCircle, Plane, Ship, DollarSign, CheckCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { createClient } from '@/lib/supabase';
import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE,
  PRODUCT_TYPES,
} from '@/lib/constants';
import { OrderStatus, Order, OrderUpdate, OrderMessage, OrderSpecification, User } from '@/types';
import { notifyOrgMembers } from '@/lib/notifications';
import Link from 'next/link';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [updates, setUpdates] = useState<OrderUpdate[]>([]);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [specification, setSpecification] = useState<OrderSpecification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [client, setClient] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }
        setAdminUser({ id: authUser.id });

        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError || !orderData) {
          setOrder(null);
          setIsLoading(false);
          return;
        }

        setOrder(orderData as Order);

        // Fetch client profile
        if (orderData.client_id) {
          const { data: clientData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', orderData.client_id)
            .single();

          if (clientData) {
            setClient(clientData as User);
          }
        }

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

        setMessages((messagesData as OrderMessage[]) || []);

        // Fetch specification
        const { data: specData } = await supabase
          .from('order_specifications')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (specData) {
          setSpecification(specData as OrderSpecification);
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderId, router]);

  const currentStatusIndex = useMemo(
    () => (order ? ORDER_TIMELINE.indexOf(order.status) : -1),
    [order]
  );

  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quote form state
  const [quoteAirPrice, setQuoteAirPrice] = useState('');
  const [quoteAirProductionDays, setQuoteAirProductionDays] = useState('');
  const [quoteAirShippingDays, setQuoteAirShippingDays] = useState('');
  const [quoteOceanPrice, setQuoteOceanPrice] = useState('');
  const [quoteOceanProductionDays, setQuoteOceanProductionDays] = useState('');
  const [quoteOceanShippingDays, setQuoteOceanShippingDays] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteFeedback, setQuoteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pre-fill quote form if data exists
  useEffect(() => {
    if (order?.quote_air_price_per_unit) setQuoteAirPrice(String(order.quote_air_price_per_unit));
    if (order?.quote_air_production_days) setQuoteAirProductionDays(String(order.quote_air_production_days));
    if (order?.quote_air_shipping_days) setQuoteAirShippingDays(String(order.quote_air_shipping_days));
    if (order?.quote_ocean_price_per_unit) setQuoteOceanPrice(String(order.quote_ocean_price_per_unit));
    if (order?.quote_ocean_production_days) setQuoteOceanProductionDays(String(order.quote_ocean_production_days));
    if (order?.quote_ocean_shipping_days) setQuoteOceanShippingDays(String(order.quote_ocean_shipping_days));
  }, [order?.quote_air_price_per_unit, order?.quote_air_production_days, order?.quote_air_shipping_days, order?.quote_ocean_price_per_unit, order?.quote_ocean_production_days, order?.quote_ocean_shipping_days]);

  const handleSubmitQuote = async () => {
    if (!quoteAirPrice || !quoteAirProductionDays || !quoteAirShippingDays || !quoteOceanPrice || !quoteOceanProductionDays || !quoteOceanShippingDays) {
      setQuoteFeedback({ type: 'error', message: 'Please fill in all quote fields.' });
      return;
    }

    setIsSubmittingQuote(true);
    setQuoteFeedback(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('orders')
        .update({
          quote_air_price_per_unit: parseFloat(quoteAirPrice),
          quote_air_lead_days: parseInt(quoteAirProductionDays) + parseInt(quoteAirShippingDays),
          quote_air_production_days: parseInt(quoteAirProductionDays),
          quote_air_shipping_days: parseInt(quoteAirShippingDays),
          quote_ocean_price_per_unit: parseFloat(quoteOceanPrice),
          quote_ocean_lead_days: parseInt(quoteOceanProductionDays) + parseInt(quoteOceanShippingDays),
          quote_ocean_production_days: parseInt(quoteOceanProductionDays),
          quote_ocean_shipping_days: parseInt(quoteOceanShippingDays),
          quote_submitted_at: new Date().toISOString(),
          status: 'quote_ready',
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create update record
      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'quote_ready',
        message: `Quote submitted: Air freight $${parseFloat(quoteAirPrice).toFixed(2)}/unit (${quoteAirProductionDays}d production + ${quoteAirShippingDays}d shipping) | Ocean freight $${parseFloat(quoteOceanPrice).toFixed(2)}/unit (${quoteOceanProductionDays}d production + ${quoteOceanShippingDays}d shipping)`,
        updated_by: adminUser?.id,
      }]);

      // Send message to client
      await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: adminUser?.id,
        sender_role: 'admin',
        message: `Your quote is ready! We've sourced your product and have two shipping options for you:\n\n✈️ Air Freight (DDP): $${parseFloat(quoteAirPrice).toFixed(2)}/unit — Production: ${quoteAirProductionDays} days | Shipping: ${quoteAirShippingDays} days | Total: ${parseInt(quoteAirProductionDays) + parseInt(quoteAirShippingDays)} days\n🚢 Ocean Freight (DDP): $${parseFloat(quoteOceanPrice).toFixed(2)}/unit — Production: ${quoteOceanProductionDays} days | Shipping: ${quoteOceanShippingDays} days | Total: ${parseInt(quoteOceanProductionDays) + parseInt(quoteOceanShippingDays)} days\n\nPlease review and select your preferred option on your order page.`,
        attachments: [],
      }]);

      setOrder({ ...order!,
        status: 'quote_ready' as any,
        quote_air_price_per_unit: parseFloat(quoteAirPrice),
        quote_air_lead_days: parseInt(quoteAirProductionDays) + parseInt(quoteAirShippingDays),
        quote_air_production_days: parseInt(quoteAirProductionDays),
        quote_air_shipping_days: parseInt(quoteAirShippingDays),
        quote_ocean_price_per_unit: parseFloat(quoteOceanPrice),
        quote_ocean_lead_days: parseInt(quoteOceanProductionDays) + parseInt(quoteOceanShippingDays),
        quote_ocean_production_days: parseInt(quoteOceanProductionDays),
        quote_ocean_shipping_days: parseInt(quoteOceanShippingDays),
        quote_submitted_at: new Date().toISOString(),
      });
      setQuoteFeedback({ type: 'success', message: 'Quote submitted and client notified!' });

      // Notify client
      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'order_status',
          title: `Quote Ready — Order #${order.order_number || orderId.slice(0, 8)}`,
          body: 'Your quote is ready! Please review the shipping options and select your preference.',
          supabaseClient: supabase,
        });
      }

      // Refresh
      const { data: updatesData } = await supabase
        .from('order_updates').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);
      const { data: messagesData } = await supabase
        .from('order_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
      setMessages((messagesData as OrderMessage[]) || []);
    } catch (error: any) {
      setQuoteFeedback({ type: 'error', message: error.message || 'Failed to submit quote.' });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleConfirmDeposit = async () => {
    setIsLoadingStatus(true);
    try {
      const supabase = createClient();
      await supabase.from('orders').update({
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
        status: 'deposit_paid'
      }).eq('id', orderId);

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'deposit_paid',
        message: 'Deposit payment confirmed. Your order is now being processed.',
        updated_by: adminUser?.id,
      }]);

      setOrder({ ...order!, status: 'deposit_paid' as any, deposit_paid: true });
      setStatusFeedback({ type: 'success', message: 'Deposit confirmed!' });

      if (order?.client_id) {
        await notifyOrgMembers({
          orderId, clientId: order.client_id, type: 'order_status',
          title: `Deposit Confirmed — Order #${order.order_number || orderId.slice(0, 8)}`,
          body: 'Your deposit has been confirmed. We are now proceeding with your order.',
          supabaseClient: supabase,
        });
      }
    } catch (error: any) {
      setStatusFeedback({ type: 'error', message: error.message || 'Failed to confirm deposit.' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !updateMessage.trim()) {
      setStatusFeedback({ type: 'error', message: 'Please select a status and enter a message.' });
      return;
    }

    setIsLoadingStatus(true);
    setStatusFeedback(null);

    try {
      const supabase = createClient();

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Create update record
      const { error: updateError } = await supabase
        .from('order_updates')
        .insert([{
          order_id: orderId,
          status: newStatus,
          message: updateMessage,
          updated_by: adminUser?.id,
        }]);

      if (updateError) throw updateError;

      setOrder({ ...order!, status: newStatus });
      setStatusFeedback({ type: 'success', message: `Status updated to "${ORDER_STATUS_LABELS[newStatus]}"` });
      setNewStatus('');
      setUpdateMessage('');

      // Send notification to client org
      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'order_status',
          title: `Order #${order.order_number || orderId.slice(0, 8)} — ${ORDER_STATUS_LABELS[newStatus]}`,
          body: updateMessage,
          supabaseClient: supabase,
        });
      }

      // Refresh updates
      const { data: updatesData } = await supabase
        .from('order_updates')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);
    } catch (error: any) {
      setStatusFeedback({ type: 'error', message: error.message || 'Failed to update status' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsLoadingMessage(true);
    setMessageFeedback(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: adminUser?.id,
        sender_role: 'admin',
        message: messageText,
        attachments: [],
      }]);

      if (error) throw error;

      // Add to local state
      const newMsg: OrderMessage = {
        id: `msg_${Date.now()}`,
        order_id: orderId,
        sender_id: adminUser?.id || '',
        sender_role: 'admin',
        message: messageText,
        attachments: [],
        created_at: new Date().toISOString(),
      };
      setMessages([...messages, newMsg]);
      setMessageText('');

      // Send notification for new message
      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'new_message',
          title: `New message on Order #${order.order_number || orderId.slice(0, 8)}`,
          body: messageText.length > 100 ? messageText.slice(0, 100) + '...' : messageText,
          supabaseClient: supabase,
        });
      }
    } catch (error: any) {
      setMessageFeedback({ type: 'error', message: error.message || 'Failed to send message' });
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleQuickAction = async (actionStatus: OrderStatus, actionMessage: string) => {
    setIsLoadingStatus(true);
    setStatusFeedback(null);

    try {
      const supabase = createClient();

      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: actionStatus })
        .eq('id', orderId);

      if (orderError) throw orderError;

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: actionStatus,
        message: actionMessage,
        updated_by: adminUser?.id,
      }]);

      // Send message to client
      await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: adminUser?.id,
        sender_role: 'admin',
        message: actionMessage,
        attachments: [],
      }]);

      setOrder({ ...order!, status: actionStatus });
      setStatusFeedback({ type: 'success', message: actionMessage });

      // Send notification
      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'order_status',
          title: `Order #${order.order_number || orderId.slice(0, 8)} — ${ORDER_STATUS_LABELS[actionStatus]}`,
          body: actionMessage,
          supabaseClient: supabase,
        });
      }

      // Refresh updates and messages
      const { data: updatesData } = await supabase
        .from('order_updates')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);

      const { data: messagesData } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      setMessages((messagesData as OrderMessage[]) || []);
    } catch (error: any) {
      setStatusFeedback({ type: 'error', message: error.message || 'Action failed' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleRequestInfo = () =>
    handleQuickAction('action_required' as OrderStatus, 'We need additional information from you to proceed with this order. Please check your messages and respond.');

  const handleSendSample = () =>
    handleQuickAction('sample_approval_pending' as OrderStatus, 'We have sent you sample items for approval. Please review them and let us know if you approve or want changes.');

  const handleRequestPayment = () =>
    handleQuickAction('action_required' as OrderStatus, 'Payment is required to proceed with your order. Please complete the payment at your earliest convenience.');

  const handleStartSourcing = () =>
    handleQuickAction('sourcing' as OrderStatus, 'We are now sourcing suppliers for your product. We will get back to you with pricing options shortly.');

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Loading order...</h2>
        </div>
      </AdminLayout>
    );
  }

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
              <h1 className="text-4xl font-bold text-gray-900">Order #{order.order_number || order.id.slice(0, 8)}</h1>
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

            {/* Quote Submission Card */}
            {(order.status === 'sourcing' || order.status === 'under_review' || order.status === 'quote_ready') && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {order.quote_submitted_at ? 'Quote Submitted' : 'Submit Quote'}
                    </h2>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {quoteFeedback && (
                    <div className={`p-3 rounded-lg border ${
                      quoteFeedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <p className="text-sm">{quoteFeedback.message}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Air Freight Quote */}
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Plane className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">DDP Air Freight</h3>
                      </div>
                      <Input
                        label="Price per Unit ($)"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 4.50"
                        value={quoteAirPrice}
                        onChange={(e) => setQuoteAirPrice(e.target.value)}
                      />
                      <div className="mt-3">
                        <Input
                          label="Production Lead Time (days)"
                          type="number"
                          placeholder="e.g. 10"
                          value={quoteAirProductionDays}
                          onChange={(e) => setQuoteAirProductionDays(e.target.value)}
                        />
                      </div>
                      <div className="mt-3">
                        <Input
                          label="Shipping Lead Time (days)"
                          type="number"
                          placeholder="e.g. 4"
                          value={quoteAirShippingDays}
                          onChange={(e) => setQuoteAirShippingDays(e.target.value)}
                        />
                      </div>
                      {quoteAirProductionDays && quoteAirShippingDays && (
                        <p className="text-xs text-gray-500 mt-1">
                          Total lead time: {parseInt(quoteAirProductionDays || '0') + parseInt(quoteAirShippingDays || '0')} days
                        </p>
                      )}
                      {quoteAirPrice && order.quantity > 0 && (
                        <p className="text-sm text-blue-600 font-medium mt-2">
                          Total: ${(parseFloat(quoteAirPrice || '0') * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>

                    {/* Ocean Freight Quote */}
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Ship className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">DDP Ocean Freight</h3>
                      </div>
                      <Input
                        label="Price per Unit ($)"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.80"
                        value={quoteOceanPrice}
                        onChange={(e) => setQuoteOceanPrice(e.target.value)}
                      />
                      <div className="mt-3">
                        <Input
                          label="Production Lead Time (days)"
                          type="number"
                          placeholder="e.g. 25"
                          value={quoteOceanProductionDays}
                          onChange={(e) => setQuoteOceanProductionDays(e.target.value)}
                        />
                      </div>
                      <div className="mt-3">
                        <Input
                          label="Shipping Lead Time (days)"
                          type="number"
                          placeholder="e.g. 20"
                          value={quoteOceanShippingDays}
                          onChange={(e) => setQuoteOceanShippingDays(e.target.value)}
                        />
                      </div>
                      {quoteOceanProductionDays && quoteOceanShippingDays && (
                        <p className="text-xs text-gray-500 mt-1">
                          Total lead time: {parseInt(quoteOceanProductionDays || '0') + parseInt(quoteOceanShippingDays || '0')} days
                        </p>
                      )}
                      {quoteOceanPrice && order.quantity > 0 && (
                        <p className="text-sm text-blue-600 font-medium mt-2">
                          Total: ${(parseFloat(quoteOceanPrice || '0') * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSubmitQuote}
                    isLoading={isSubmittingQuote}
                    className="w-full"
                  >
                    {order.quote_submitted_at ? 'Update & Resubmit Quote' : 'Submit Quote to Client'}
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Quote & Shipping Summary (visible after quote accepted) */}
            {order.selected_shipping && (
              <Card className="border border-green-200">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${order.selected_shipping === 'air' ? 'bg-blue-100' : 'bg-cyan-100'}`}>
                      {order.selected_shipping === 'air' ? <Plane className="w-5 h-5 text-blue-600" /> : <Ship className="w-5 h-5 text-cyan-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Client selected: DDP {order.selected_shipping === 'air' ? 'Air' : 'Ocean'} Freight
                      </p>
                      <p className="text-sm text-gray-600">
                        ${(order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit)?.toFixed(2)}/unit
                        · Production: {order.selected_shipping === 'air' ? order.quote_air_production_days : order.quote_ocean_production_days}d
                        · Shipping: {order.selected_shipping === 'air' ? order.quote_air_shipping_days : order.quote_ocean_shipping_days}d
                        · Total: {order.selected_shipping === 'air' ? order.quote_air_lead_days : order.quote_ocean_lead_days} days
                      </p>
                    </div>
                    {order.deposit_paid && (
                      <Badge variant="success" className="ml-auto">
                        <CheckCircle className="w-3 h-3 mr-1" /> Deposit Paid
                      </Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Deposit Confirmation Card */}
            {order.status === 'deposit_required' && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Awaiting 30% Deposit</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-gray-700 mb-3">
                    The client has accepted the quote and needs to pay a 30% deposit of{' '}
                    <span className="font-bold">${order.deposit_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> to proceed.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Payment will be processed automatically via Stripe. You can also manually confirm if payment was received via wire.
                  </p>
                  <Button variant="primary" onClick={handleConfirmDeposit} isLoading={isLoadingStatus}>
                    Manually Confirm Deposit Received
                  </Button>
                </CardBody>
              </Card>
            )}

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
                {statusFeedback && (
                  <div className={`p-3 rounded-lg border ${
                    statusFeedback.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <p className="text-sm">{statusFeedback.message}</p>
                  </div>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleStartSourcing}
                    isLoading={isLoadingStatus}
                    className="w-full"
                  >
                    Start Sourcing
                  </Button>
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
                      {client?.company_name?.charAt(0) || client?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {client?.company_name || 'Loading...'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {client?.email || ''}
                      </p>
                      {client?.full_name && (
                        <p className="text-xs text-gray-500">
                          {client.full_name}
                        </p>
                      )}
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
                          {isAdmin ? 'Admin' : 'Client'}
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
