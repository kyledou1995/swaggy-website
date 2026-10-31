/**
 * Client-facing order email templates (server-side).
 * Every email links back to the portal; replies to these emails are not monitored.
 */
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS } from '@/lib/constants';

export type ClientEmailEvent =
  | 'order_received'
  | 'quote_ready'
  | 'payment_request'
  | 'deposit_confirmed'
  | 'final_payment_required'
  | 'final_payment_confirmed'
  | 'invoice'
  | 'refund'
  | 'sample_pricing'
  | 'sample_paid'
  | 'sample_photos'
  | 'sample_qty'
  | 'samples_shipped'
  | 'status_change'
  | 'cancelled'
  | 'reactivated'
  | 'new_message'
  | 'info_requested';

export interface ClientEmailContext {
  order: Order;
  recipientName?: string | null;
  /** Free text from the team (status note, message, reason...). */
  message?: string | null;
  /** New status, for status_change events. */
  status?: OrderStatus | null;
  /** Amount for payment_request / refund when not derivable from the order. */
  amount?: number | null;
  baseUrl: string;
}

const FONT = 'Inter,Helvetica,Arial,sans-serif';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number | null | undefined) =>
  n == null ? '' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d.length === 10 ? `${d}T12:00:00Z` : d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const firstName = (n?: string | null) => (n || '').trim().split(/\s+/)[0] || 'there';

interface Parts {
  subject: string;
  preheader: string;
  heading: string;
  body: string; // trusted HTML
  quote?: string | null; // untrusted text, escaped
  rows?: [string, string][];
  highlight?: [string, string];
  cta: string;
  ctaPath?: string; // defaults to the order page
  footer?: string;
}

function orderNo(o: Order) {
  return o.order_number || o.id.slice(0, 8);
}
function orderTotal(o: Order) {
  const unit = o.selected_shipping === 'air' ? o.quote_air_price_per_unit : o.quote_ocean_price_per_unit;
  return unit ? unit * o.quantity : null;
}

function render(p: Parts, ctx: ClientEmailContext) {
  const o = ctx.order;
  const url = `${ctx.baseUrl}${p.ctaPath || `/portal/orders/${o.id}`}`;
  const rows = p.rows?.filter(([, v]) => v);
  const rowsHtml = rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border:1px solid #eeeeee;border-radius:10px;border-collapse:separate">${rows
        .map(
          ([k, v], i) =>
            `<tr><td style="padding:10px 14px;font:13px ${FONT};color:#737373;${i ? 'border-top:1px solid #f3f3f3;' : ''}">${esc(k)}</td><td align="right" style="padding:10px 14px;font:600 13px ${FONT};color:#171717;${i ? 'border-top:1px solid #f3f3f3;' : ''}">${esc(v)}</td></tr>`
        )
        .join('')}</table>`
    : '';
  const quoteHtml = p.quote
    ? `<div style="margin:0 0 22px;padding:14px 16px;background:#f5f5f5;border-left:3px solid #10b981;border-radius:6px;font:14px/1.55 ${FONT};color:#404040;white-space:pre-wrap">${esc(p.quote)}</div>`
    : '';
  const hl = p.highlight
    ? `<div style="margin:0 0 22px;padding:16px;background:#ecfdf5;border-radius:10px;text-align:center"><div style="font:12px ${FONT};color:#047857;text-transform:uppercase;letter-spacing:.06em">${esc(p.highlight[0])}</div><div style="font:800 28px ${FONT};color:#171717;margin-top:4px">${esc(p.highlight[1])}</div></div>`
    : '';
  const footer =
    p.footer ||
    'This mailbox isn’t monitored, so please don’t reply to this email. To ask a question, open your order in the Merchin portal and send us a message there.';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(p.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f5f5"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 20px 4px"><a href="${ctx.baseUrl}" style="text-decoration:none;font:700 24px ${FONT};letter-spacing:-0.5px;color:#171717">merchin<span style="color:#10b981">.</span></a></td></tr>
<tr><td bgcolor="#ffffff" style="border:1px solid #e5e5e5;border-top:4px solid #10b981;border-radius:12px;padding:32px">
<div style="font:600 12px ${FONT};color:#059669;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Order ${esc(orderNo(o))}${o.product_type ? ` · ${esc(o.product_type)}` : ''}</div>
<div style="font:700 22px/1.3 ${FONT};color:#171717;margin-bottom:14px">${esc(p.heading)}</div>
<div style="font:15px/1.6 ${FONT};color:#525252;margin-bottom:22px">${p.body}</div>
${hl}${quoteHtml}${rowsHtml}
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#10b981" style="border-radius:8px"><a href="${url}" style="display:inline-block;padding:13px 26px;font:600 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:8px">${esc(p.cta)}</a></td></tr></table>
<div style="margin-top:26px;padding-top:18px;border-top:1px solid #f0f0f0;font:12.5px/1.5 ${FONT};color:#737373">${esc(footer)}</div>
</td></tr>
<tr><td align="center" style="padding:20px;font:12px/1.6 ${FONT};color:#a3a3a3">Merchin · Sourcing made simple for ecommerce brands<br>Manage email preferences in your portal under <a href="${ctx.baseUrl}/portal/notifications" style="color:#737373">Notification Preferences</a>.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Order ${orderNo(o)}${o.product_type ? ` · ${o.product_type}` : ''}`,
    '',
    p.heading,
    '',
    p.body.replace(/<[^>]+>/g, ''),
    p.highlight ? `\n${p.highlight[0]}: ${p.highlight[1]}` : '',
    p.quote ? `\n"${p.quote}"` : '',
    rows?.length ? '\n' + rows.map(([k, v]) => `${k}: ${v}`).join('\n') : '',
    '',
    `${p.cta}: ${url}`,
    '',
    footer,
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  return { subject: p.subject, html, text };
}

export function renderClientEmail(event: ClientEmailEvent, ctx: ClientEmailContext) {
  const o = ctx.order;
  const no = orderNo(o);
  const msg = ctx.message?.trim() || null;
  const total = orderTotal(o);
  const deposit = o.deposit_amount ?? (total ? total * 0.3 : null);
  const ship = o.selected_shipping === 'air' ? 'DDP Air' : o.selected_shipping === 'ocean' ? 'DDP Ocean' : '';
  const units = o.quantity ? `${o.quantity.toLocaleString('en-US')} units` : '';

  let p: Parts;
  switch (event) {
    case 'order_received':
      p = {
        subject: `We received your order ${no}`,
        preheader: 'Our team is reviewing it now.',
        heading: `Thanks, ${firstName(ctx.recipientName)} — we got your order`,
        body: 'Our team is reviewing your request now. We will confirm within <b>3 business days</b> and then start sourcing suppliers.',
        rows: [
          ['Product', o.product_type],
          ['Quantity', units],
          ['Target delivery', fmtDate(o.target_delivery_date)],
        ],
        cta: 'View your order',
      };
      break;
    case 'quote_ready': {
      const air = o.quote_air_price_per_unit
        ? `${money(o.quote_air_price_per_unit)} / unit${o.quote_air_production_days || o.quote_air_shipping_days ? ` · ~${(o.quote_air_production_days || 0) + (o.quote_air_shipping_days || 0)} days` : ''}`
        : '';
      const ocean = o.quote_ocean_price_per_unit
        ? `${money(o.quote_ocean_price_per_unit)} / unit${o.quote_ocean_production_days || o.quote_ocean_shipping_days ? ` · ~${(o.quote_ocean_production_days || 0) + (o.quote_ocean_shipping_days || 0)} days` : ''}`
        : '';
      p = {
        subject: `Your quote for ${no} is ready`,
        preheader: 'Compare air and ocean shipping and choose.',
        heading: 'Your quote is ready',
        body: 'Review your landed cost for each shipping option and choose the one that works best. Prices include production, freight, customs, and duties (DDP).',
        rows: [
          ['DDP Air', air],
          ['DDP Ocean', ocean],
        ],
        cta: 'Review your quote',
      };
      break;
    }
    case 'payment_request': {
      const amt = ctx.amount ?? null;
      p = {
        subject: `Payment request for ${no}${amt ? `: ${money(amt)}` : ''}`,
        preheader: 'Pay securely by card or bank transfer.',
        heading: 'A payment is due on your order',
        body: 'Pay securely online by card or US bank transfer. Your order continues as soon as payment is received.',
        highlight: amt ? ['Amount due', money(amt)] : undefined,
        quote: amt ? null : msg,
        cta: 'Pay now',
      };
      break;
    }
    case 'deposit_confirmed':
      p = {
        subject: `Deposit received — ${no} is in motion`,
        preheader: 'Thanks! Your order is officially underway.',
        heading: 'Deposit received — thank you!',
        body: 'Your deposit is confirmed and your order is officially in motion. Next up: samples for your approval.',
        rows: [
          ['Deposit paid', money(deposit)],
          ['Remaining balance', total && deposit ? `${money(total - deposit)} · due before shipping` : ''],
        ],
        cta: 'View your order',
      };
      break;
    case 'final_payment_required': {
      const due = o.final_payment_amount ?? (total ? total - (o.deposit_amount || 0) : null);
      p = {
        subject: `Final payment due for ${no}${due ? `: ${money(due)}` : ''}`,
        preheader: 'Your order is packed and ready to ship.',
        heading: 'Your order is packed and ready',
        body: 'The remaining balance is due before we can ship. Once paid, your order heads out right away.',
        highlight: due ? ['Balance due', money(due)] : undefined,
        cta: 'Pay balance',
      };
      break;
    }
    case 'final_payment_confirmed':
      p = {
        subject: `Payment complete — ${no} is getting ready to ship`,
        preheader: 'We are preparing your shipment.',
        heading: 'Payment complete',
        body: 'Your balance is paid in full. We are preparing your shipment and will let you know as soon as it leaves.',
        cta: 'View your order',
      };
      break;
    case 'invoice':
      p = {
        subject: `Invoice for order ${no}`,
        preheader: 'Your invoice is ready to view and download.',
        heading: 'Your invoice is ready',
        body: 'You can view and download it anytime from your order page.',
        rows: [
          ['Order total', money(total)],
          ['Deposit paid', o.deposit_paid ? money(o.deposit_amount) : ''],
          ['Balance', total && o.deposit_paid ? money(total - (o.deposit_amount || 0)) : ''],
        ],
        cta: 'View invoice',
      };
      break;
    case 'refund': {
      const amt = ctx.amount ?? o.refund_amount ?? null;
      p = {
        subject: `Refund issued for ${no}${amt ? `: ${money(amt)}` : ''}`,
        preheader: 'Refunds take 5–10 business days to appear.',
        heading: 'Your refund is on the way',
        body: 'We have issued your refund. Depending on your bank, it can take <b>5–10 business days</b> to appear on your statement.',
        highlight: amt ? ['Refund amount', money(amt)] : undefined,
        quote: o.refund_note || null,
        cta: 'View your order',
      };
      break;
    }
    case 'sample_pricing':
      p = {
        subject: `Sample pricing ready for ${no}`,
        preheader: 'Review sample cost and lead time.',
        heading: 'Sample pricing is ready',
        body: 'Review the cost and lead time for samples. Once approved, we will produce samples and share photos for your review.',
        rows: [
          ['Cost per sample', money(o.sample_price_per_unit)],
          ['Production time', o.sample_shipping_days ? `~${o.sample_shipping_days} days` : ''],
        ],
        cta: 'Review sample pricing',
      };
      break;
    case 'sample_paid':
      p = {
        subject: `Sample payment received — ${no}`,
        preheader: 'We are producing your samples.',
        heading: 'Sample payment received',
        body: 'Thanks! We are producing your samples now and will share photos for your approval as soon as they are ready.',
        cta: 'View your order',
      };
      break;
    case 'sample_photos': {
      const n = o.sample_images?.length || 0;
      p = {
        subject: `Your samples are ready to review — ${no}`,
        preheader: n ? `${n} new photo${n === 1 ? '' : 's'} waiting for your approval.` : 'New sample photos are waiting for your approval.',
        heading: 'Your samples are ready to review',
        body: `We uploaded ${n ? `<b>${n} photo${n === 1 ? '' : 's'}</b>` : 'photos'} of your samples. Approve them to start full production, or request physical samples shipped to you.`,
        quote: o.sample_description || null,
        cta: 'Review samples',
      };
      break;
    }
    case 'sample_qty':
      p = {
        subject: `Sample quantity updated for ${no}`,
        preheader: 'Updated sample count and total.',
        heading: 'We adjusted your sample quantity',
        body: 'Here is what changed:',
        quote: msg,
        cta: 'View your order',
      };
      break;
    case 'samples_shipped':
      p = {
        subject: `Your samples have shipped — ${no}`,
        preheader: o.sample_shipping_days ? `Estimated delivery in about ${o.sample_shipping_days} days.` : 'Your samples are on the way.',
        heading: 'Your samples are on the way',
        body: `Your physical samples have shipped${o.sample_shipping_days ? ` and should arrive in about <b>${o.sample_shipping_days} days</b>` : ''}. Once you have reviewed them, approve or request changes in your portal.`,
        cta: 'View your order',
      };
      break;
    case 'cancelled':
      p = {
        subject: `Order ${no} has been cancelled`,
        preheader: 'Details about your cancellation.',
        heading: 'Your order has been cancelled',
        body: 'Your order was cancelled. If a deposit was paid, any refund will be confirmed in a separate email.',
        quote: o.cancellation_reason ? `Reason: ${o.cancellation_reason}` : msg,
        cta: 'View your order',
      };
      break;
    case 'reactivated':
      p = {
        subject: `Order ${no} has been reactivated`,
        preheader: 'Your order is back under review.',
        heading: 'Your order is back on',
        body: 'Your order has been reactivated and is under review again. We will update you on the next steps shortly.',
        cta: 'View your order',
      };
      break;
    case 'info_requested':
      p = {
        subject: `Action needed: we need more information for ${no}`,
        preheader: msg ? msg.slice(0, 90) : 'Please upload a file or reply in your portal.',
        heading: 'We need a bit more information',
        body: 'Your order is on hold until we hear back. Open your order to upload photos or files, or reply with the details below.',
        quote: msg,
        cta: 'Upload or reply',
      };
      break;
    case 'new_message':
      p = {
        subject: `New message from Merchin about ${no}`,
        preheader: msg ? msg.slice(0, 90) : 'You have a new message.',
        heading: 'You have a new message',
        body: '<b>Merchin team</b> wrote:',
        quote: msg,
        cta: 'Reply in your portal',
        ctaPath: '/portal/messages',
        footer:
          'This mailbox isn’t monitored, so replies to this email won’t reach us. Please reply in the Merchin portal. To limit message emails, adjust Notification Preferences in your portal.',
      };
      break;
    case 'status_change':
    default: {
      const status = ctx.status || o.status;
      const label = ORDER_STATUS_LABELS[status] || status;
      if (status === 'sourcing') {
        p = {
          subject: `Your order ${no} is accepted — sourcing has started`,
          preheader: 'We are finding the best suppliers.',
          heading: 'Your order is accepted',
          body: 'Great news — we are now sourcing suppliers and preparing your quote. This usually takes up to <b>5 business days</b>. We will email you as soon as it is ready.',
          cta: 'View your order',
        };
      } else if (status === 'action_required') {
        p = {
          subject: `Action needed on order ${no}`,
          preheader: 'We need a bit more information to keep going.',
          heading: 'We need a bit more information',
          body: 'Your order is on hold until we hear back. Open it in your portal to upload photos or files, or reply with the details.',
          quote: msg,
          cta: 'Upload or reply',
        };
      } else if (status === 'in_transit') {
        p = {
          subject: `Your order ${no} has shipped`,
          preheader: 'Track your shipment in the portal.',
          heading: 'Your order is on its way',
          body: `Your order has left the factory and is in transit${ship ? ` by <b>${ship}</b>` : ''}. Duties and customs are handled — nothing for you to do.`,
          quote: msg,
          rows: [['Shipping', ship]],
          cta: 'Track shipment',
        };
      } else if (status === 'delivered') {
        p = {
          subject: `Delivered — your order ${no} has arrived`,
          preheader: 'We hope you love it.',
          heading: 'Your order has been delivered',
          body: 'Your order has arrived. Please inspect it and let us know in the portal within <b>14 days</b> if anything is not right. Thank you for building with Merchin!',
          quote: msg,
          cta: 'View your order',
        };
      } else if (status === 'cancelled') {
        return renderClientEmail('cancelled', ctx);
      } else {
        p = {
          subject: `Update on ${no}: ${label}`,
          preheader: 'Your order moved to a new stage.',
          heading: `Your order is now: ${label}`,
          body: msg ? 'Here is the latest from our team:' : 'Your order just moved to the next stage.',
          quote: msg,
          cta: 'Track your order',
        };
      }
    }
  }
  return render(p, ctx);
}
