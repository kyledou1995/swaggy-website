/**
 * Admin-facing order email templates (server-side).
 * Sent to every admin when a client takes an action that needs the team.
 */
import type { Order } from '@/types';

export type AdminEmailEvent =
  | 'new_order'
  | 'new_message'
  | 'quote_accepted'
  | 'sample_pricing_approved'
  | 'sample_paid'
  | 'physical_samples_requested'
  | 'sample_approved'
  | 'sample_changes_requested'
  | 'deposit_paid'
  | 'final_payment_paid'
  | 'order_cancelled';

export interface AdminEmailContext {
  order: Order;
  client: { full_name?: string | null; company_name?: string | null; email?: string | null } | null;
  /** Who took the action (may be a teammate of the order owner). */
  actorName?: string | null;
  message?: string | null;
  amount?: number | null;
  baseUrl: string;
}

const FONT = 'Inter,Helvetica,Arial,sans-serif';
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number | null | undefined) =>
  n == null ? '' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00Z` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

type Tone = 'action' | 'money' | 'info' | 'alert';
const TONES: Record<Tone, { bg: string; fg: string; label: string }> = {
  action: { bg: '#fef3c7', fg: '#b45309', label: 'Action needed' },
  money: { bg: '#dcfce7', fg: '#15803d', label: 'Payment received' },
  info: { bg: '#e0f2fe', fg: '#0369a1', label: 'Update' },
  alert: { bg: '#fee2e2', fg: '#b91c1c', label: 'Heads up' },
};

interface Parts {
  subject: string;
  preheader: string;
  tone: Tone;
  heading: string;
  body: string; // trusted HTML
  quote?: string | null;
  quoteLabel?: string;
  rows?: [string, string][];
  highlight?: [string, string];
  cta: string;
  ctaPath?: string;
}

function render(p: Parts, ctx: AdminEmailContext) {
  const o = ctx.order;
  const no = o.order_number || o.id.slice(0, 8);
  const url = `${ctx.baseUrl}${p.ctaPath || `/admin/orders/${o.id}`}`;
  const tone = TONES[p.tone];
  const clientLine = [ctx.client?.company_name, ctx.client?.full_name].filter(Boolean).join(' · ');
  const rows = [...(p.rows || []), ['Client', clientLine] as [string, string], ['Client email', ctx.client?.email || ''] as [string, string]].filter(
    ([, v]) => v
  );

  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border:1px solid #eeeeee;border-radius:10px;border-collapse:separate">${rows
        .map(
          ([k, v], i) =>
            `<tr><td style="padding:9px 14px;font:13px ${FONT};color:#737373;${i ? 'border-top:1px solid #f3f3f3;' : ''}">${esc(k)}</td><td align="right" style="padding:9px 14px;font:600 13px ${FONT};color:#171717;${i ? 'border-top:1px solid #f3f3f3;' : ''}">${esc(v)}</td></tr>`
        )
        .join('')}</table>`
    : '';
  const quoteHtml = p.quote
    ? `${p.quoteLabel ? `<div style="font:600 12px ${FONT};color:#737373;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${esc(p.quoteLabel)}</div>` : ''}<div style="margin:0 0 22px;padding:14px 16px;background:#f5f5f5;border-left:3px solid #10b981;border-radius:6px;font:14px/1.55 ${FONT};color:#404040;white-space:pre-wrap">${esc(p.quote)}</div>`
    : '';
  const hl = p.highlight
    ? `<div style="margin:0 0 22px;padding:16px;background:#ecfdf5;border-radius:10px;text-align:center"><div style="font:12px ${FONT};color:#047857;text-transform:uppercase;letter-spacing:.06em">${esc(p.highlight[0])}</div><div style="font:800 28px ${FONT};color:#171717;margin-top:4px">${esc(p.highlight[1])}</div></div>`
    : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(p.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f5f5"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td bgcolor="#171717" style="border-radius:12px 12px 0 0;padding:16px 24px">
  <span style="font:700 20px ${FONT};letter-spacing:-0.5px;color:#ffffff">merchin<span style="color:#10b981">.</span></span>
  <span style="font:600 11px ${FONT};color:#a3a3a3;text-transform:uppercase;letter-spacing:.08em;margin-left:8px">Admin</span>
</td></tr>
<tr><td bgcolor="#ffffff" style="border:1px solid #e5e5e5;border-top:0;border-radius:0 0 12px 12px;padding:28px 28px 26px">
<span style="display:inline-block;padding:3px 10px;border-radius:99px;background:${tone.bg};color:${tone.fg};font:600 11px ${FONT};text-transform:uppercase;letter-spacing:.05em">${tone.label}</span>
<div style="font:600 12px ${FONT};color:#737373;margin:14px 0 6px">Order ${esc(no)}${o.product_type ? ` · ${esc(o.product_type)}` : ''}</div>
<div style="font:700 21px/1.3 ${FONT};color:#171717;margin-bottom:12px">${esc(p.heading)}</div>
<div style="font:15px/1.6 ${FONT};color:#525252;margin-bottom:20px">${p.body}</div>
${hl}${quoteHtml}${rowsHtml}
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#171717" style="border-radius:8px"><a href="${url}" style="display:inline-block;padding:12px 24px;font:600 14px ${FONT};color:#ffffff;text-decoration:none;border-radius:8px">${esc(p.cta)} &rarr;</a></td></tr></table>
</td></tr>
<tr><td align="center" style="padding:18px;font:12px/1.6 ${FONT};color:#a3a3a3">Internal notification for Merchin admins · sent from an unmonitored address</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `[${tone.label}] Order ${no}${o.product_type ? ` · ${o.product_type}` : ''}`,
    '',
    p.heading,
    '',
    p.body.replace(/<[^>]+>/g, ''),
    p.highlight ? `\n${p.highlight[0]}: ${p.highlight[1]}` : '',
    p.quote ? `\n${p.quoteLabel ? p.quoteLabel + ': ' : ''}"${p.quote}"` : '',
    rows.length ? '\n' + rows.map(([k, v]) => `${k}: ${v}`).join('\n') : '',
    '',
    `${p.cta}: ${url}`,
  ].join('\n');

  return { subject: p.subject, html, text };
}

export function renderAdminEmail(event: AdminEmailEvent, ctx: AdminEmailContext) {
  const o = ctx.order;
  const no = o.order_number || o.id.slice(0, 8);
  const who = ctx.actorName || ctx.client?.full_name || 'The client';
  const company = ctx.client?.company_name || who;
  const units = o.quantity ? `${o.quantity.toLocaleString('en-US')} units` : '';
  const msg = ctx.message?.trim() || null;
  const ship = o.selected_shipping === 'air' ? 'DDP Air' : o.selected_shipping === 'ocean' ? 'DDP Ocean' : '';
  const unit = o.selected_shipping === 'air' ? o.quote_air_price_per_unit : o.selected_shipping === 'ocean' ? o.quote_ocean_price_per_unit : null;
  const total = unit ? unit * o.quantity : null;

  let p: Parts;
  switch (event) {
    case 'new_order':
      p = {
        subject: `New order ${no} from ${company}`,
        preheader: `${units} ${o.product_type} — review within 3 business days.`,
        tone: 'action',
        heading: `New order from ${company}`,
        body: `${esc(who)} just submitted an order. Review it and accept it to start sourcing — the client was told to expect a response within <b>3 business days</b>.`,
        rows: [
          ['Product', o.product_type],
          ['Quantity', units],
          ['Target unit price', money(o.target_price)],
          ['Target delivery', fmtDate(o.target_delivery_date)],
          ['Packaging', o.packaging_required ? 'Custom packaging requested' : ''],
        ],
        quote: o.product_description || o.notes || null,
        quoteLabel: 'Details from client',
        cta: 'Review order',
      };
      break;
    case 'new_message':
      p = {
        subject: `New message from ${company} on ${no}`,
        preheader: msg ? msg.slice(0, 90) : 'A client sent a message.',
        tone: 'action',
        heading: `${who} sent a message`,
        body: 'Reply from the order page in the admin portal.',
        quote: msg,
        cta: 'Reply in admin',
      };
      break;
    case 'quote_accepted':
      p = {
        subject: `Quote accepted on ${no} — ${ship || 'shipping selected'}`,
        preheader: 'The client chose a shipping option. Deposit is next.',
        tone: 'info',
        heading: 'Quote accepted',
        body: `${esc(who)} accepted the quote. The client has been asked to pay the deposit — you'll get another email when it's paid.`,
        rows: [
          ['Shipping', ship],
          ['Unit price', unit ? `${money(unit)} / unit` : ''],
          ['Order total', money(total)],
          ['Deposit due', money(o.deposit_amount ?? (total ? total * 0.3 : null))],
        ],
        cta: 'View order',
      };
      break;
    case 'sample_pricing_approved':
      p = {
        subject: `Sample pricing approved on ${no}`,
        preheader: 'The client approved sample pricing.',
        tone: 'info',
        heading: 'Sample pricing approved',
        body: `${esc(who)} approved the sample pricing. Once the sample payment comes in, start sample production.`,
        quote: msg,
        cta: 'View order',
      };
      break;
    case 'sample_paid':
      p = {
        subject: `Sample payment received on ${no}${ctx.amount ? `: ${money(ctx.amount)}` : ''}`,
        preheader: 'Prepare sample photos or shipment.',
        tone: 'money',
        heading: 'Sample payment received',
        body: 'The client paid for samples. Prepare sample photos or ship physical samples.',
        highlight: ctx.amount ? ['Amount paid', money(ctx.amount)] : undefined,
        cta: 'Open order',
      };
      break;
    case 'physical_samples_requested':
      p = {
        subject: `Physical samples requested on ${no}`,
        preheader: 'The client wants samples shipped for review.',
        tone: 'action',
        heading: 'Physical samples requested',
        body: `${esc(who)} wants physical samples shipped before approving.`,
        rows: [['Samples requested', o.sample_quantity_requested ? String(o.sample_quantity_requested) : '']],
        cta: 'Arrange samples',
      };
      break;
    case 'sample_approved':
      p = {
        subject: `Samples approved on ${no} — ready for production`,
        preheader: 'Move this order into manufacturing.',
        tone: 'action',
        heading: 'Samples approved — start production',
        body: `${esc(who)} approved the samples. Move the order into manufacturing.`,
        rows: [['Quantity', units], ['Shipping', ship]],
        cta: 'Start manufacturing',
      };
      break;
    case 'sample_changes_requested':
      p = {
        subject: `Sample changes requested on ${no}`,
        preheader: msg ? msg.slice(0, 90) : 'The client asked for changes to the samples.',
        tone: 'action',
        heading: 'Changes requested on samples',
        body: `${esc(who)} asked for changes before approving. Coordinate a revised sample with the factory.`,
        quote: msg,
        quoteLabel: 'Requested changes',
        cta: 'View request',
      };
      break;
    case 'deposit_paid':
      p = {
        subject: `Deposit received on ${no}${ctx.amount ? `: ${money(ctx.amount)}` : ''}`,
        preheader: 'The order is now active.',
        tone: 'money',
        heading: 'Deposit received — order is active',
        body: 'The client paid the deposit. Kick off sampling with the factory.',
        highlight: ctx.amount ? ['Amount paid', money(ctx.amount)] : undefined,
        rows: [['Order total', money(total)], ['Shipping', ship]],
        cta: 'Open order',
      };
      break;
    case 'final_payment_paid':
      p = {
        subject: `Final payment received on ${no}${ctx.amount ? `: ${money(ctx.amount)}` : ''}`,
        preheader: 'Ready to ship.',
        tone: 'money',
        heading: 'Final payment received — ready to ship',
        body: 'The balance is paid in full. Book the shipment and mark the order in transit.',
        highlight: ctx.amount ? ['Amount paid', money(ctx.amount)] : undefined,
        cta: 'Open order',
      };
      break;
    case 'order_cancelled':
    default:
      p = {
        subject: `Order ${no} cancelled by ${company}`,
        preheader: 'The client cancelled this order.',
        tone: 'alert',
        heading: 'Client cancelled the order',
        body: o.deposit_paid
          ? `${esc(who)} cancelled this order. <b>A deposit was paid</b> — review whether a refund is due.`
          : `${esc(who)} cancelled this order. No deposit was paid.`,
        quote: o.cancellation_reason || msg,
        quoteLabel: 'Reason',
        rows: [['Deposit paid', o.deposit_paid ? money(o.deposit_amount) : 'No']],
        cta: 'Review order',
      };
  }
  return render(p, ctx);
}
