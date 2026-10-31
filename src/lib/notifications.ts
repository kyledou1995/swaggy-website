import { createClient } from '@/lib/supabase';
import { NotificationType } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';
import type { ClientEmailEvent } from '@/lib/client-emails';
import type { AdminEmailEvent } from '@/lib/admin-emails';

export interface AdminEmailOptions {
  event: AdminEmailEvent;
  amount?: number;
  /** Defaults to the notification body. */
  message?: string;
}

export interface OrderEmailOptions {
  event: ClientEmailEvent;
  status?: string;
  amount?: number;
  /** Defaults to the notification body. */
  message?: string;
}

/**
 * Ask the server to email the client's organization about an order update.
 * Runs in the browser (admin portal / order form); fire-and-forget.
 */
export async function requestOrderEmail(
  orderId: string,
  options: OrderEmailOptions | (AdminEmailOptions & { audience: 'admin' }),
  supabaseClient?: SupabaseClient
) {
  try {
    if (typeof window === 'undefined') return;
    const supabase = supabaseClient || createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/notifications/email', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ orderId, ...options }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.error) console.warn('Order email not sent:', res.status, result);
  } catch (err) {
    console.warn('Could not send order email:', err);
  }
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string;
  targetRole?: 'client' | 'admin';
  supabaseClient?: SupabaseClient;
}

/**
 * Create an in-app notification for a user.
 * Accepts an optional supabaseClient to reuse an authenticated session.
 */
export async function createNotification(params: CreateNotificationParams) {
  const supabase = params.supabaseClient || createClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    order_id: params.orderId || null,
    target_role: params.targetRole || 'client',
    is_read: false,
    email_sent: false,
  });

  if (error) {
    console.error('Error creating notification:', error);
  }

  return { error };
}

/**
 * Create notifications for all members of an organization.
 * Used when an order status changes or a message is received,
 * since org members share orders.
 * These are CLIENT-facing notifications.
 */
export async function notifyOrgMembers({
  orderId,
  clientId,
  type,
  title,
  body,
  supabaseClient,
  email,
}: {
  orderId: string;
  clientId: string;
  type: NotificationType;
  title: string;
  body: string;
  supabaseClient?: SupabaseClient;
  /** Also email the client. Message emails are sent automatically for new_message. */
  email?: OrderEmailOptions | false;
}) {
  const supabase = supabaseClient || createClient();

  const emailOptions: OrderEmailOptions | null =
    email === false ? null : email ? email : type === 'new_message' ? { event: 'new_message' } : null;
  if (emailOptions) {
    requestOrderEmail(orderId, { ...emailOptions, message: emailOptions.message ?? body }, supabase);
  }

  // Get the org of the client who owns the order
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', clientId)
    .single();

  if (!profile?.organization_id) {
    // Fallback: just notify the order owner
    return createNotification({ userId: clientId, type, title, body, orderId, targetRole: 'client', supabaseClient: supabase });
  }

  // Get all org members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, notify_order_status, notify_new_message')
    .eq('organization_id', profile.organization_id)
    .eq('invite_status', 'active');

  if (!members || members.length === 0) {
    return createNotification({ userId: clientId, type, title, body, orderId, targetRole: 'client', supabaseClient: supabase });
  }

  // Filter members based on their notification preferences
  const eligibleMembers = members.filter((m: any) => {
    if (type === 'order_status') return m.notify_order_status !== false;
    if (type === 'new_message') return m.notify_new_message !== false;
    return true;
  });

  // Insert notifications for all eligible members
  const notifications = eligibleMembers.map((m: any) => ({
    user_id: m.id,
    type,
    title,
    body,
    order_id: orderId,
    target_role: 'client',
    is_read: false,
    email_sent: false,
  }));

  if (notifications.length > 0) {
    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      console.error('Error creating org notifications:', error);
    }
    return { error };
  }

  return { error: null };
}

/**
 * Create notifications for all admin users.
 * Used when a client takes an action (new order, message, payment, etc.)
 * These are ADMIN-facing notifications.
 */
export async function notifyAdmins({
  orderId,
  type,
  title,
  body,
  supabaseClient,
  email,
}: {
  orderId?: string;
  type: NotificationType;
  title: string;
  body: string;
  supabaseClient?: SupabaseClient;
  /** Also email the admin team. Message emails are sent automatically for new_message. */
  email?: AdminEmailOptions | false;
}) {
  const supabase = supabaseClient || createClient();

  const emailOptions: AdminEmailOptions | null =
    email === false ? null : email ? email : type === 'new_message' ? { event: 'new_message' } : null;
  if (emailOptions && orderId) {
    requestOrderEmail(orderId, { audience: 'admin', ...emailOptions, message: emailOptions.message ?? body }, supabase);
  }

  // Get all admin users
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (!admins || admins.length === 0) {
    console.warn('No admin users found for notification');
    return { error: null };
  }

  const notifications = admins.map((admin: any) => ({
    user_id: admin.id,
    type,
    title,
    body,
    order_id: orderId || null,
    target_role: 'admin',
    is_read: false,
    email_sent: false,
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('Error creating admin notifications:', error);
  }
  return { error };
}
