'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Send, FileText, AlertCircle, Plane, Ship, DollarSign, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

  // Cancel order state and handler
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setStatusFeedback({ type: 'error', message: 'Please provide a reason for cancellation.' });
      return;
    }

    setIsCancelling(true);
    setStatusFeedback(null);

    try {
      const supabase = createClient();

      await supabase.from('orders').update({
        status: 'cancelled',
        cancellation_reason: cancelReason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: adminUser?.id,
      }).eq('id', orderId);

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'cancelled',
        message: `Order cancelled. Reason: ${cancelReason}`,
        updated_by: adminUser?.id,
      }]);

      await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: adminUser?.id,
        sender_role: 'admin',
        message: `This order has been cancelled.\n\nReason: ${cancelReason}\n\nIf you have any questions, please reply to this message.`,
        attachments: [],
      }]);

      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'order_status',
          title: `Order #${order?.order_number || orderId.slice(0, 8)} — Cancelled`,
          body: `Your order has been cancelled. Reason: ${cancelReason}`,
          supabaseClient: supabase,
        });
      }

      setOrder({ ...order!, status: 'cancelled' as any, cancellation_reason: cancelReason, cancelled_at: new Date().toISOString() });
      setShowCancelModal(false);
      setCancelReason('');
      setStatusFeedback({ type: 'success', message: 'Order has been cancelled.' });

      // Refresh updates and messages
      const { data: updatesData } = await supabase.from('order_updates').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);
      const { data: messagesData } = await supabase.from('order_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
      setMessages((messagesData as OrderMessage[]) || []);
    } catch (error: any) {
      setStatusFeedback({ type: 'error', message: error.message || 'Failed to cancel order.' });
    } finally {
      setIsCancelling(false);
    }
  };

  // Reactivate a cancelled order
  const handleReactivateOrder = async () => {
    setIsLoadingStatus(true);
    try {
      const supabase = createClient();
      await supabase.from('orders').update({
        status: 'under_review',
        cancellation_reason: null,
        cancelled_at: null,
        cancelled_by: null,
      }).eq('id', orderId);

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'under_review',
        message: 'Order has been reactivated and is now under review.',
        updated_by: adminUser?.id,
      }]);

      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'order_status',
          title: `Order #${order?.order_number || orderId.slice(0, 8)} — Reactivated`,
          body: 'Your order has been reactivated and is now under review.',
          supabaseClient: supabase,
        });
      }

      setOrder({ ...order!, status: 'under_review' as any, cancellation_reason: null, cancelled_at: null, cancelled_by: null });
      setStatusFeedback({ type: 'success', message: 'Order has been reactivated.' });

      const { data: updatesData } = await supabase.from('order_updates').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);
    } catch (error: any) {
      setStatusFeedback({ type: 'error', message: error.message || 'Failed to reactivate order.' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Invoice & payment request state
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [paymentRequestAmount, setPaymentRequestAmount] = useState('');
  const [paymentRequestNote, setPaymentRequestNote] = useState('');
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);

  const handleRequestPaymentCustom = async () => {
    if (!paymentRequestAmount || parseFloat(paymentRequestAmount) <= 0) return;
    setIsRequestingPayment(true);
    try {
      const supabase = createClient();
      const amount = parseFloat(paymentRequestAmount);
      const reason = paymentRequestNote.trim();

      await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: adminUser?.id,
        sender_role: 'admin',
        message: `💰 Payment Request — $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\nOrder: #${order?.order_number || orderId.slice(0, 8)}${reason ? `\nReason: ${reason}` : ''}\n\nPlease arrange payment at your earliest convenience. If you have questions, reply to this message.`,
        attachments: [],
      }]);

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: order?.status || 'action_required',
        message: `Payment of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} requested from client.${reason ? ` Reason: ${reason}` : ''}`,
        updated_by: adminUser?.id,
      }]);

      if (order?.client_id) {
        await notifyOrgMembers({
          orderId, clientId: order.client_id, type: 'order_status',
          title: `Payment Request — Order #${order?.order_number || orderId.slice(0, 8)}`,
          body: `A payment of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been requested.`,
          supabaseClient: supabase,
        });
      }

      setShowPaymentRequest(false);
      setPaymentRequestAmount('');
      setPaymentRequestNote('');
      setStatusFeedback({ type: 'success', message: `Payment request of $${amount.toFixed(2)} sent to client.` });

      // Refresh
      const { data: messagesData } = await supabase.from('order_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
      setMessages((messagesData as OrderMessage[]) || []);
      const { data: updatesData } = await supabase.from('order_updates').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);
    } catch (e: any) {
      setStatusFeedback({ type: 'error', message: e.message || 'Failed to send payment request.' });
    } finally {
      setIsRequestingPayment(false);
    }
  };

  // Refund state and handler
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (order?.deposit_amount && !refundAmount) {
      setRefundAmount(String(order.deposit_amount));
    }
  }, [order?.deposit_amount]);

  const handleIssueRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      setStatusFeedback({ type: 'error', message: 'Please enter a valid refund amount.' });
      return;
    }

    setIsRefunding(true);
    setStatusFeedback(null);

    try {
      const supabase = createClient();

      await supabase.from('orders').update({
        refund_amount: parseFloat(refundAmount),
        refund_issued: true,
        refund_issued_at: new Date().toISOString(),
        refund_note: refundNote || null,
      }).eq('id', orderId);

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'cancelled',
        message: `Refund of $${parseFloat(refundAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} has been issued.${refundNote ? ` Note: ${refundNote}` : ''}`,
        updated_by: adminUser?.id,
      }]);

      await supabase.from('order_messages').insert([{
        order_id: orderId,
        sender_id: adminUser?.id,
        sender_role: 'admin',
        message: `A refund of $${parseFloat(refundAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} has been issued for your deposit. Please allow 5–10 business days for the refund to appear in your account.${refundNote ? `\n\nNote: ${refundNote}` : ''}`,
        attachments: [],
      }]);

      if (order?.client_id) {
        await notifyOrgMembers({
          orderId,
          clientId: order.client_id,
          type: 'order_status',
          title: `Refund Issued — Order #${order?.order_number || orderId.slice(0, 8)}`,
          body: `A refund of $${parseFloat(refundAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} has been issued for your deposit.`,
          supabaseClient: supabase,
        });
      }

      setOrder({ ...order!, refund_amount: parseFloat(refundAmount), refund_issued: true, refund_issued_at: new Date().toISOString(), refund_note: refundNote || null });
      setShowRefundForm(false);
      setStatusFeedback({ type: 'success', message: 'Refund recorded and client notified.' });

      const { data: updatesData } = await supabase.from('order_updates').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      setUpdates((updatesData as OrderUpdate[]) || []);
      const { data: messagesData } = await supabase.from('order_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
      setMessages((messagesData as OrderMessage[]) || []);
    } catch (error: any) {
      setStatusFeedback({ type: 'error', message: error.message || 'Failed to issue refund.' });
    } finally {
      setIsRefunding(false);
    }
  };

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
                    : order.status === 'cancelled'
                    ? 'error'
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

        {/* Cancelled Banner */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-red-800 text-lg">Order Cancelled</h3>
                {order.cancellation_reason && (
                  <p className="text-red-700 mt-1"><span className="font-medium">Reason:</span> {order.cancellation_reason}</p>
                )}
                {order.cancelled_at && (
                  <p className="text-red-600 text-sm mt-1">Cancelled on {new Date(order.cancelled_at).toLocaleString()}</p>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={handleReactivateOrder} isLoading={isLoadingStatus}>
                Reactivate Order
              </Button>
            </div>

            {/* Deposit & Refund Status */}
            {order.deposit_paid && (
              <div className="border-t border-red-200 pt-4">
                {order.refund_issued ? (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">
                        Refund of ${order.refund_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} Issued
                      </p>
                      {order.refund_issued_at && (
                        <p className="text-sm text-green-700">Issued on {new Date(order.refund_issued_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <DollarSign className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800">Deposit of ${order.deposit_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} received</p>
                      <p className="text-sm text-yellow-700">Use the Accounting & Billing panel on the right to issue a refund.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                  options={[
                    ...ORDER_TIMELINE.map((status) => ({
                      value: status,
                      label: ORDER_STATUS_LABELS[status],
                    })),
                    { value: 'action_required', label: 'Action Required' },
                    { value: 'cancelled', label: '⚠ Cancelled' },
                  ]}
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

            {/* Cancel Order */}
            {order.status !== 'cancelled' && (
              <Card className="border border-red-200">
                <CardBody>
                  {!showCancelModal ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-700">Need to cancel this order?</span>
                      </div>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-red-800">Cancel Order</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        This will cancel the order and notify the client. Please provide a reason for the cancellation.
                      </p>
                      <Textarea
                        label="Cancellation Reason"
                        placeholder="e.g. Product out of stock, pricing issue, client request..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                          className="flex-1"
                        >
                          Go Back
                        </Button>
                        <button
                          onClick={handleCancelOrder}
                          disabled={isCancelling || !cancelReason.trim()}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

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

            {/* Accounting & Billing */}
            <Card className="border-2 border-gray-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Accounting & Billing</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Quote Summary */}
                {order.quote_air_price_per_unit || order.quote_ocean_price_per_unit ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quote</p>
                    <div className="space-y-2">
                      {order.quote_air_price_per_unit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Air Freight</span>
                          <span className="font-medium text-gray-900">${order.quote_air_price_per_unit.toFixed(2)}/unit</span>
                        </div>
                      )}
                      {order.quote_air_price_per_unit && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 pl-2">× {order.quantity.toLocaleString()} units</span>
                          <span className="text-gray-700">${(order.quote_air_price_per_unit * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {order.quote_ocean_price_per_unit && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Ocean Freight</span>
                          <span className="font-medium text-gray-900">${order.quote_ocean_price_per_unit.toFixed(2)}/unit</span>
                        </div>
                      )}
                      {order.quote_ocean_price_per_unit && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 pl-2">× {order.quantity.toLocaleString()} units</span>
                          <span className="text-gray-700">${(order.quote_ocean_price_per_unit * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {order.quote_submitted_at && (
                        <p className="text-xs text-gray-400 mt-1">Quoted {new Date(order.quote_submitted_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quote</p>
                    <p className="text-sm text-gray-400">No quote submitted yet</p>
                  </div>
                )}

                <div className="border-t border-gray-100" />

                {/* Selected Option & Order Value */}
                {order.selected_shipping ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Value</p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Selected</span>
                        <span className="font-medium text-gray-900">DDP {order.selected_shipping === 'air' ? 'Air' : 'Ocean'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unit Price</span>
                        <span className="font-medium text-gray-900">
                          ${(order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit)?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-medium text-gray-900">{order.quantity.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">Total Order</span>
                        <span className="font-bold text-gray-900">
                          ${(((order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit) || 0) * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order Value</p>
                    <p className="text-sm text-gray-400">No shipping option selected</p>
                  </div>
                )}

                <div className="border-t border-gray-100" />

                {/* Deposit */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deposit (30%)</p>
                  {order.deposit_amount ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium text-gray-900">${order.deposit_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        {order.deposit_paid ? (
                          <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium">Pending</span>
                        )}
                      </div>
                      {order.deposit_paid_at && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Paid on</span>
                          <span className="text-gray-500">{new Date(order.deposit_paid_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {order.stripe_payment_intent_id && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Stripe ID</span>
                          <span className="text-gray-500 font-mono text-[10px]">{order.stripe_payment_intent_id.slice(0, 20)}...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No deposit required yet</p>
                  )}
                </div>

                {/* Remaining Balance */}
                {order.selected_shipping && order.deposit_paid && (
                  <>
                    <div className="border-t border-gray-100" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Balance</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Order Total</span>
                          <span className="text-gray-900">
                            ${(((order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit) || 0) * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Deposit Paid</span>
                          <span className="text-green-700">-${(order.deposit_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                          <span className="text-sm font-semibold text-gray-700">Remaining</span>
                          <span className="font-bold text-gray-900">
                            ${((((order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit) || 0) * order.quantity) - (order.deposit_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Refund */}
                {order.refund_issued && (
                  <>
                    <div className="border-t border-gray-100" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Refund</p>
                      <div className="bg-green-50 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Refunded</span>
                          <span className="font-bold text-green-800">${order.refund_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {order.refund_issued_at && (
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">Issued</span>
                            <span className="text-green-600">{new Date(order.refund_issued_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        {order.refund_note && (
                          <p className="text-xs text-green-700 mt-1">{order.refund_note}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Net Revenue (if deposit paid and no full refund) */}
                {order.deposit_paid && (
                  <>
                    <div className="border-t border-gray-200" />
                    <div className="bg-gray-900 text-white rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-300">Net Received</span>
                        <span className="text-lg font-bold">
                          ${((order.deposit_amount || 0) - (order.refund_issued ? (order.refund_amount || 0) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* ──── ACTIONS SECTION ──── */}
                <div className="border-t-2 border-gray-200 pt-4 mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</p>
                  <div className="space-y-2">

                    {/* Download Invoice */}
                    {order.selected_shipping && (
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            window.open(`/api/invoices?orderId=${orderId}&type=deposit`, '_blank');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          Download Deposit Invoice
                        </button>
                        <button
                          onClick={() => {
                            window.open(`/api/invoices?orderId=${orderId}&type=full`, '_blank');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          Download Full Invoice
                        </button>
                        {order.deposit_paid && (
                          <button
                            onClick={() => {
                              window.open(`/api/invoices?orderId=${orderId}&type=balance`, '_blank');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <FileText className="w-4 h-4 text-gray-500" />
                            Download Balance Invoice
                          </button>
                        )}
                      </div>
                    )}

                    {/* Send Invoice to Client */}
                    {order.selected_shipping && !sendingInvoice && !invoiceSent && (
                      <button
                        onClick={async () => {
                          setSendingInvoice(true);
                          try {
                            const supabase = createClient();
                            const pricePerUnit = order.selected_shipping === 'air' ? order.quote_air_price_per_unit : order.quote_ocean_price_per_unit;
                            const totalVal = (pricePerUnit || 0) * order.quantity;
                            const depositVal = order.deposit_amount || totalVal * 0.3;

                            await supabase.from('order_messages').insert([{
                              order_id: orderId,
                              sender_id: adminUser?.id,
                              sender_role: 'admin',
                              message: `📄 Invoice for Order #${order.order_number || orderId.slice(0, 8)}\n\nProduct: ${order.product_type}\nQuantity: ${order.quantity.toLocaleString()} units\nUnit Price: $${(pricePerUnit || 0).toFixed(2)}\nOrder Total: $${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n${!order.deposit_paid ? `\n30% Deposit Due: $${depositVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `\nDeposit Paid: $${(order.deposit_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\nRemaining Balance: $${(totalVal - (order.deposit_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}\n\nPlease review and let us know if you have any questions.`,
                              attachments: [],
                            }]);

                            if (order.client_id) {
                              await notifyOrgMembers({
                                orderId, clientId: order.client_id, type: 'order_status',
                                title: `Invoice — Order #${order.order_number || orderId.slice(0, 8)}`,
                                body: 'An invoice has been sent for your order. Please check your messages.',
                                supabaseClient: supabase,
                              });
                            }

                            setInvoiceSent(true);
                            // Refresh messages
                            const { data: messagesData } = await supabase.from('order_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
                            setMessages((messagesData as OrderMessage[]) || []);
                          } catch (e) {
                            setStatusFeedback({ type: 'error', message: 'Failed to send invoice.' });
                          } finally {
                            setSendingInvoice(false);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                      >
                        <Send className="w-4 h-4 text-blue-500" />
                        Send Invoice to Client
                      </button>
                    )}
                    {sendingInvoice && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                        <span className="animate-spin">⏳</span> Sending invoice...
                      </div>
                    )}
                    {invoiceSent && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4" /> Invoice sent to client
                      </div>
                    )}

                    <div className="border-t border-gray-100 my-2" />

                    {/* Request Payment */}
                    {!showPaymentRequest ? (
                      <button
                        onClick={() => setShowPaymentRequest(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
                      >
                        <DollarSign className="w-4 h-4 text-orange-500" />
                        Request Payment from Client
                      </button>
                    ) : (
                      <div className="bg-orange-50 rounded-lg p-3 space-y-2 border border-orange-200">
                        <p className="text-xs font-semibold text-orange-800">Request Payment</p>
                        <Input
                          label="Amount ($)"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={paymentRequestAmount}
                          onChange={(e) => setPaymentRequestAmount(e.target.value)}
                        />
                        <Textarea
                          label="Reason"
                          placeholder="e.g. Remaining balance, additional charges..."
                          value={paymentRequestNote}
                          onChange={(e) => setPaymentRequestNote(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowPaymentRequest(false); setPaymentRequestAmount(''); setPaymentRequestNote(''); }}
                            className="flex-1 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRequestPaymentCustom}
                            disabled={isRequestingPayment || !paymentRequestAmount}
                            className="flex-1 px-3 py-1.5 text-xs text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                          >
                            {isRequestingPayment ? 'Sending...' : 'Send Request'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Issue Refund (available anytime deposit was paid) */}
                    {order.deposit_paid && !order.refund_issued && (
                      <>
                        {!showRefundForm ? (
                          <button
                            onClick={() => setShowRefundForm(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                            Issue Refund to Client
                          </button>
                        ) : (
                          <div className="bg-red-50 rounded-lg p-3 space-y-2 border border-red-200">
                            <p className="text-xs font-semibold text-red-800">Issue Refund</p>
                            <Input
                              label="Refund Amount ($)"
                              type="number"
                              step="0.01"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Original deposit: ${order.deposit_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <Textarea
                              label="Note (optional)"
                              placeholder="e.g. Full refund — cancelled before production"
                              value={refundNote}
                              onChange={(e) => setRefundNote(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowRefundForm(false)}
                                className="flex-1 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleIssueRefund}
                                disabled={isRefunding || !refundAmount}
                                className="flex-1 px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                {isRefunding ? 'Processing...' : `Refund $${refundAmount ? parseFloat(refundAmount).toFixed(2) : '0.00'}`}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {order.refund_issued && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span>Refund of ${order.refund_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} issued</span>
                      </div>
                    )}
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
