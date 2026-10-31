import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { renderAdminSignupEmail } from '@/lib/admin-emails';

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.merchin.co').replace(/\/$/, '');
const MAX_AGE_MS = 15 * 60 * 1000; // only announce accounts created in the last 15 minutes

/**
 * Called by the signup form right after an account is created (the new user has
 * no session yet because email confirmation is pending). We verify the user
 * really was just created, then notify every admin in-app and by email — once.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { userId } = (await request.json().catch(() => ({}))) as { userId?: string };
  if (!userId || typeof userId !== 'string') return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  const { data: lookup, error } = await admin.auth.admin.getUserById(userId);
  const user = lookup?.user;
  if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (Date.now() - new Date(user.created_at).getTime() > MAX_AGE_MS) {
    return NextResponse.json({ skipped: 'not a new signup' });
  }

  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).single();
  if (profile?.role === 'admin') return NextResponse.json({ skipped: 'admin account' });

  const client = {
    full_name: profile?.full_name || user.user_metadata?.full_name || null,
    company_name: profile?.company_name || user.user_metadata?.company_name || null,
    email: user.email || profile?.email || null,
  };
  const title = `New client signup — ${client.company_name || client.full_name || client.email}`;
  const body = `${client.full_name || 'Someone'}${client.company_name ? ` from ${client.company_name}` : ''} created an account (${client.email}).`;

  // Only notify once per account
  const { data: existing } = await admin
    .from('notifications')
    .select('id')
    .eq('target_role', 'admin')
    .ilike('title', 'New client signup%')
    .ilike('body', `%(${client.email})%`)
    .limit(1);
  if (existing?.length) return NextResponse.json({ skipped: 'already notified' });

  type AdminProfile = { id: string; email: string; email_order_status?: boolean | null };
  const { data: admins } = await admin.from('profiles').select('*').eq('role', 'admin');
  const adminList = (admins || []) as AdminProfile[];

  // In-app notifications (fall back to a known type if 'new_signup' isn't allowed by the DB)
  if (adminList.length) {
    const rows = (type: string) =>
      adminList.map((a) => ({ user_id: a.id, type, title, body, order_id: null, target_role: 'admin', is_read: false, email_sent: false }));
    const { error: insertError } = await admin.from('notifications').insert(rows('new_signup'));
    if (insertError) await admin.from('notifications').insert(rows('order_status'));
  }

  // Emails
  const email = renderAdminSignupEmail({ client, baseUrl: BASE_URL });
  let sent = 0;
  for (const a of adminList.filter((x) => x.email && x.email_order_status !== false)) {
    const res = await sendEmail({ to: a.email, ...email, replyTo: null });
    if (res.sent) sent++;
    else console.error('signup-email: send failed', res.error);
  }
  console.log(`signup-email: ${client.email} → notified ${adminList.length} admins, ${sent} emails`);
  return NextResponse.json({ notified: adminList.length, sent });
}
