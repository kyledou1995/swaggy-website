/**
 * Reminder emails: the client follow-up (bundled, one per organization per day)
 * and the hand-off alert to the Merchin team.
 */
import type { Order } from '@/types';
import type { ReminderKind } from '@/lib/reminders';

const FONT = 'Inter,Helvetica,Arial,sans-serif';
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n?: number | null) =>
  n == null ? '' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const firstName = (n?: string | null) => (n || '').trim().split(/\s+/)[0] || 'there';
const orderNo = (o: Order) => o.order_number || o.id.slice(0, 8);
const clip = (s: string, n = 220) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export interface ReminderLine {
  order: Order;
  kind: ReminderKind;
  detail?: string | null;
  reminderNo: number;
  isFinal: boolean;
}

/** What we're asking for, why it matters, and the button label. */
export function reminderCopy(kind: ReminderKind, o: Order): { action: string; why: string; cta: string } {
  switch (kind) {
    case 'quote':
      return { action: 'Choose your shipping option', why: 'Your quote is ready. Pick air or ocean freight so we can move your order forward.', cta: 'Review quote' };
    case 'deposit':
      return {
        action: `Pay your deposit${o.deposit_amount ? ` of ${money(o.deposit_amount)}` : ''}`,
        why: 'Your deposit locks in your order so we can start samples and production.',
        cta: 'Pay deposit',
      };
    case 'sample_pricing':
      return { action: 'Approve your sample pricing', why: 'Review the sample cost and lead time and choose a quantity so we can produce your samples.', cta: 'Review sample pricing' };
    case 'sample_payment':
      return { action: 'Pay for your samples', why: 'You approved the sample pricing. Once payment is in, we start producing your samples.', cta: 'Pay for samples' };
    case 'sample_review':
      return { action: 'Review your samples', why: 'Your sample photos are ready. Approve them or tell us what to change so production can begin.', cta: 'Review samples' };
    case 'final_payment':
      return {
        action: `Pay your remaining balance${o.final_payment_amount ? ` of ${money(o.final_payment_amount)}` : ''}`,
        why: 'Your order is ready to ship as soon as the final payment is complete.',
        cta: 'Pay balance',
      };
    case 'info_request':
      return { action: 'Send us the information we asked for', why: 'Your order is on hold until we hear back from you.', cta: 'Respond now' };
    case 'action_required':
      return { action: 'Respond to our request', why: 'Your order is on hold until we hear back from you.', cta: 'Open order' };
    case 'message':
      return { action: 'You have an unread message from Merchin', why: 'Our team sent you a message about this order.', cta: 'Read message' };
  }
}

function shell(opts: { title: string; preheader: string; heading: string; intro: string; cards: string; footer: string; baseUrl: string; prefsLink?: boolean }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f5f5"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 20px 4px"><a href="${opts.baseUrl}" style="text-decoration:none;font:700 24px ${FONT};letter-spacing:-0.5px;color:#171717">merchin<span style="color:#10b981">.</span></a></td></tr>
<tr><td bgcolor="#ffffff" style="border:1px solid #e5e5e5;border-top:4px solid #10b981;border-radius:12px;padding:32px">
<div style="font:700 22px/1.3 ${FONT};color:#171717;margin-bottom:12px">${esc(opts.heading)}</div>
<div style="font:15px/1.6 ${FONT};color:#525252;margin-bottom:22px">${opts.intro}</div>
${opts.cards}
<div style="margin-top:8px;padding-top:18px;border-top:1px solid #f0f0f0;font:12.5px/1.5 ${FONT};color:#737373">${esc(opts.footer)}</div>
</td></tr>
<tr><td align="center" style="padding:20px;font:12px/1.6 ${FONT};color:#a3a3a3">Merchin · Sourcing made simple for ecommerce brands${
    opts.prefsLink
      ? `<br>Don’t want reminders? Turn them off in <a href="${opts.baseUrl}/portal/notifications" style="color:#737373">Notification Preferences</a>.`
      : ''
  }</td></tr>
</table></td></tr></table></body></html>`;
}

function card(opts: { eyebrow: string; title: string; body: string; quote?: string | null; cta: string; url: string; dark?: boolean }) {
  const quote = opts.quote
    ? `<div style="margin:10px 0 0;padding:10px 12px;background:#f5f5f5;border-left:3px solid #10b981;border-radius:6px;font:13.5px/1.5 ${FONT};color:#404040;white-space:pre-wrap">${esc(clip(opts.quote))}</div>`
    : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #e5e5e5;border-radius:10px;border-collapse:separate"><tr><td style="padding:16px 18px">
<div style="font:600 11.5px ${FONT};color:#059669;text-transform:uppercase;letter-spacing:.06em">${esc(opts.eyebrow)}</div>
<div style="font:700 16px/1.35 ${FONT};color:#171717;margin-top:4px">${esc(opts.title)}</div>
<div style="font:14px/1.55 ${FONT};color:#525252;margin-top:4px">${esc(opts.body)}</div>${quote}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px"><tr><td bgcolor="${opts.dark ? '#171717' : '#10b981'}" style="border-radius:8px"><a href="${opts.url}" style="display:inline-block;padding:10px 20px;font:600 14px ${FONT};color:#ffffff;text-decoration:none;border-radius:8px">${esc(opts.cta)} &rarr;</a></td></tr></table>
</td></tr></table>`;
}

export function renderClientReminderEmail(lines: ReminderLine[], ctx: { recipientName?: string | null; baseUrl: string }) {
  const final = lines.some((l) => l.isFinal);
  const second = !final && lines.some((l) => l.reminderNo >= 2 && l.kind !== 'message');
  const onlyMessages = lines.every((l) => l.kind === 'message');
  const one = lines.length === 1 ? lines[0] : null;
  const oneCopy = one ? reminderCopy(one.kind, one.order) : null;

  const subject = one
    ? onlyMessages
      ? `You have an unread message from Merchin — ${orderNo(one.order)}`
      : `${final ? 'Final reminder' : 'Reminder'}: ${oneCopy!.action.replace(/ of \$[\d,.]+$/, '')} — ${orderNo(one.order)}`
    : `Reminder: ${lines.length} items need your attention`;

  const heading = onlyMessages
    ? 'You have an unread message'
    : !one
      ? `${lines.length} things need your attention`
      : final
      ? 'Final reminder: your order is waiting on you'
      : second
        ? 'Your order is waiting on you'
        : one
          ? 'A quick reminder'
          : `${lines.length} things need your attention`;

  const intro = onlyMessages
    ? `Hi ${esc(firstName(ctx.recipientName))}, the Merchin team sent you ${one ? 'a message that hasn’t' : 'messages that haven’t'} been read yet.`
    : !one
      ? `Hi ${esc(firstName(ctx.recipientName))}, a few things in the Merchin portal are waiting on you.${final ? ' Items marked <b>Final reminder</b> won’t get another automatic email, so if you need more time or have questions, just send us a message in the portal.' : ''}`
      : final
      ? `Hi ${esc(firstName(ctx.recipientName))}, this is our last automatic reminder. If you need more time or have questions, just send us a message in the portal and we’ll help.`
      : second
        ? `Hi ${esc(firstName(ctx.recipientName))}, we’re still waiting on you before we can keep things moving.`
        : `Hi ${esc(firstName(ctx.recipientName))}, just a reminder that ${one ? 'this needs' : 'these need'} your attention in the Merchin portal.`;

  const cards = lines
    .map((l) => {
      const c = reminderCopy(l.kind, l.order);
      return card({
        eyebrow: `Order ${orderNo(l.order)}${l.order.product_type ? ` · ${l.order.product_type}` : ''}${!one && l.isFinal ? ' · Final reminder' : ''}`,
        title: c.action,
        body: c.why,
        quote: l.kind === 'info_request' || l.kind === 'message' ? l.detail : null,
        cta: c.cta,
        url: `${ctx.baseUrl}/portal/orders/${l.order.id}`,
      });
    })
    .join('');

  const footer = 'This mailbox isn’t monitored, so please don’t reply to this email. Questions? Open your order in the Merchin portal and send us a message.';
  const html = shell({
    title: subject,
    preheader: one ? `${oneCopy!.action}. ${oneCopy!.why}` : lines.map((l) => reminderCopy(l.kind, l.order).action).join(' · '),
    heading,
    intro,
    cards,
    footer,
    baseUrl: ctx.baseUrl,
    prefsLink: true,
  });
  const text = [
    heading,
    '',
    intro.replace(/<[^>]+>/g, '').replace(/&rsquo;|’/g, "'"),
    '',
    ...lines.map((l) => {
      const c = reminderCopy(l.kind, l.order);
      return `• Order ${orderNo(l.order)}: ${c.action}\n  ${c.why}${l.detail && (l.kind === 'info_request' || l.kind === 'message') ? `\n  "${clip(l.detail)}"` : ''}\n  ${c.cta}: ${ctx.baseUrl}/portal/orders/${l.order.id}`;
    }),
    '',
    footer,
    `Turn off reminders: ${ctx.baseUrl}/portal/notifications`,
  ].join('\n');
  return { subject, html, text };
}

export interface HandoffLine {
  order: Order;
  kind: ReminderKind;
  detail?: string | null;
  company: string;
  since: string;
}

export function renderAdminHandoffEmail(lines: HandoffLine[], ctx: { baseUrl: string }) {
  const days = (iso: string) => Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  const subject =
    lines.length === 1
      ? `Follow up personally: ${lines[0].company} hasn’t responded — ${orderNo(lines[0].order)}`
      : `Follow up personally: ${lines.length} client items have gone quiet`;
  const cards = lines
    .map((l) =>
      card({
        eyebrow: `${l.company} · Order ${orderNo(l.order)}`,
        title: reminderCopy(l.kind, l.order).action,
        body: `Waiting ${days(l.since)} days. The client got 3 automatic reminders (24 hours, day 3, day 7) with no response.`,
        quote: l.kind === 'info_request' ? l.detail : null,
        cta: 'Open order',
        url: `${ctx.baseUrl}/admin/orders/${l.order.id}`,
        dark: true,
      })
    )
    .join('');
  const html = shell({
    title: subject,
    preheader: 'Automatic reminders are done. Time for a personal follow-up.',
    heading: 'Time for a personal follow-up',
    intro: 'Automatic reminders have run their course. A quick personal message or call usually gets things moving.',
    cards,
    footer: 'Sent automatically by Merchin’s reminder system. No more automatic reminders will go to the client for these items.',
    baseUrl: ctx.baseUrl,
  });
  const text = [
    'Time for a personal follow-up',
    '',
    ...lines.map((l) => `• ${l.company} · Order ${orderNo(l.order)}: ${reminderCopy(l.kind, l.order).action} (waiting ${days(l.since)} days)\n  ${ctx.baseUrl}/admin/orders/${l.order.id}`),
  ].join('\n');
  return { subject, html, text };
}
