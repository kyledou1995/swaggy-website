import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runClientReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Daily run from Vercel Cron (see vercel.json).
 * If CRON_SECRET is set in Vercel, only requests carrying it are accepted (Vercel adds it automatically).
 * The job is idempotent: running it twice never sends a reminder twice.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const isVercelCron = (request.headers.get('user-agent') || '').includes('vercel-cron');
  if (secret ? auth !== `Bearer ${secret}` : !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = serviceClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 });

  const r = await runClientReminders(admin);
  console.log('reminders:', JSON.stringify({ weekday: r.weekday, pending: r.pending, due: r.remindersDue.map((d) => `${d.order}:${d.kind}#${d.reminder}`), handoffs: r.handoffs.length, sent: r.emailsSent, errors: r.errors }));
  // Counts only — no client details in the cron response
  return NextResponse.json({
    weekday: r.weekday,
    pending: r.pending,
    reminders: r.remindersDue.length,
    emailsSent: r.emailsSent,
    handoffs: r.handoffs.length,
    resolved: r.resolved,
    errors: r.errors.length,
  });
}

/** Admin: preview (dryRun) or run now. Requires an admin session token. */
export async function POST(request: NextRequest) {
  const admin = serviceClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 });
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean; only?: { orderId?: string; itemKey?: string } };
  const only = body.only?.orderId && body.only?.itemKey ? { orderId: body.only.orderId, itemKey: body.only.itemKey } : undefined;
  const r = await runClientReminders(admin, { dryRun: body.dryRun !== false, only });
  return NextResponse.json(r);
}
