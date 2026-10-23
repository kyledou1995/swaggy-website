import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { accountDeletedEmail, sendEmail } from '@/lib/email';

/**
 * Permanently deletes a client user (auth account + profile + their orders via
 * cascade) and emails them a confirmation. Admin-only.
 */
export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel → Settings → Environment Variables.' },
      { status: 500 }
    );
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // ── Verify the caller is a signed-in admin ──
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: { user: caller }, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).single();
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  // ── Validate target ──
  const { userId } = await request.json().catch(() => ({ userId: null }));
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (userId === caller.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  const { data: target } = await admin
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single();
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'Remove admin access before deleting this user.' }, { status: 400 });
  }

  const { count: memberCount } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', userId)
    .neq('id', userId);
  if (memberCount && memberCount > 0) {
    return NextResponse.json(
      {
        error: `${target.full_name} owns a team with ${memberCount} other member${memberCount === 1 ? '' : 's'}. Delete those team members first.`,
      },
      { status: 400 }
    );
  }

  // ── Detach references that don't cascade, so the delete can't be blocked ──
  await admin.from('order_updates').update({ created_by: null }).eq('created_by', userId);
  await admin.from('order_messages').update({ sender_id: null }).eq('sender_id', userId);
  await admin.from('profiles').update({ invited_by: null }).eq('invited_by', userId);
  await admin.from('profiles').update({ parent_user_id: null }).eq('parent_user_id', userId);
  await admin.from('notifications').delete().eq('user_id', userId);

  // Collect uploaded files on this user's orders so they can be removed from storage.
  const { data: orders } = await admin
    .from('orders')
    .select('id, inspiration_images, logo_files, sample_images, packaging_dieline_files')
    .eq('client_id', userId);
  const orderCount = orders?.length || 0;
  const orderIds = (orders || []).map((o) => o.id);

  const fileUrls: string[] = [];
  for (const o of orders || []) {
    for (const key of ['inspiration_images', 'logo_files', 'sample_images', 'packaging_dieline_files'] as const) {
      const v = (o as Record<string, unknown>)[key];
      if (Array.isArray(v)) fileUrls.push(...v.filter((x): x is string => typeof x === 'string'));
    }
  }
  if (orderIds.length) {
    const { data: msgs } = await admin.from('order_messages').select('attachments').in('order_id', orderIds);
    for (const m of msgs || []) if (Array.isArray(m.attachments)) fileUrls.push(...m.attachments);
  }
  const marker = '/storage/v1/object/public/order-inspiration/';
  const storagePaths = [
    ...new Set(
      fileUrls
        .map((u) => (u.includes(marker) ? decodeURIComponent(u.split(marker)[1].split('?')[0]) : null))
        .filter((p): p is string => !!p)
    ),
  ];

  // ── Delete the auth user (cascades to profile → orders → order data) ──
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: `Could not delete user: ${deleteError.message}` }, { status: 500 });
  }

  // Remove their uploaded files (best effort; in batches).
  for (let i = 0; i < storagePaths.length; i += 100) {
    const { error } = await admin.storage.from('order-inspiration').remove(storagePaths.slice(i, i + 100));
    if (error) console.warn('Failed removing some files:', error.message);
  }

  // ── Notify the user (best effort; deletion already succeeded) ──
  const email = accountDeletedEmail(target.full_name);
  const emailResult = target.email
    ? await sendEmail({ to: target.email, ...email })
    : { sent: false, error: 'User had no email address' };
  if (!emailResult.sent) console.warn('Account-deleted email not sent:', emailResult.error);

  return NextResponse.json({
    ok: true,
    ordersDeleted: orderCount,
    filesDeleted: storagePaths.length,
    emailSent: emailResult.sent,
    emailError: emailResult.sent ? undefined : emailResult.error,
  });
}
