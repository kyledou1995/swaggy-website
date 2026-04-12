import { createClient } from '@/lib/supabase';
import { NotificationType } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string;
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
 * Accepts an optional supabaseClient to reuse an authenticated session.
 */
export async function notifyOrgMembers({
  orderId,
  clientId,
  type,
  title,
  body,
  supabaseClient,
}: {
  orderId: string;
  clientId: string;
  type: NotificationType;
  title: string;
  body: string;
  supabaseClient?: SupabaseClient;
}) {
  const supabase = supabaseClient || createClient();

  // Get the org of the client who owns the order
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', clientId)
    .single();

  if (!profile?.organization_id) {
    // Fallback: just notify the order owner
    return createNotification({ userId: clientId, type, title, body, orderId, supabaseClient: supabase });
  }

  // Get all org members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, notify_order_status, notify_new_message')
    .eq('organization_id', profile.organization_id)
    .eq('invite_status', 'active');

  if (!members || members.length === 0) {
    return createNotification({ userId: clientId, type, title, body, orderId, supabaseClient: supabase });
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
