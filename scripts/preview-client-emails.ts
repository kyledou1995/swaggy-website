/* Renders every client email with sample data: npx tsx scripts/preview-client-emails.ts out.html */
import { writeFileSync } from 'fs';
import { renderClientEmail, type ClientEmailEvent } from '../src/lib/client-emails';
import type { Order } from '../src/types';

const order = {
  id: '00000000-0000-0000-0000-000000000000', client_id: 'x', order_number: 'MRC-104237', status: 'manufacturing',
  product_type: 'Bags & Totes', product_description: '', quantity: 1000, target_price: 6, target_delivery_date: '2026-12-31',
  notes: '', created_at: '', updated_at: '',
  quote_air_price_per_unit: 8.4, quote_air_production_days: 25, quote_air_shipping_days: 7,
  quote_ocean_price_per_unit: 5.75, quote_ocean_production_days: 25, quote_ocean_shipping_days: 35,
  selected_shipping: 'ocean', deposit_amount: 1725, deposit_paid: true, final_payment_amount: 4025,
  sample_price_per_unit: 25, sample_shipping_days: 7, sample_images: ['a', 'b', 'c'], sample_description: 'Natural canvas with 2-color screen print.',
  cancellation_reason: 'Requested by client.', refund_amount: 1725,
} as unknown as Order;

const cases: [string, string, ClientEmailEvent, Record<string, unknown>][] = [
  ['Order placed & quote', 'Client submits an order', 'order_received', {}],
  ['Order placed & quote', 'Admin accepts the order (status → Sourcing)', 'status_change', { status: 'sourcing' }],
  ['Order placed & quote', 'Admin submits a quote', 'quote_ready', {}],
  ['Order placed & quote', 'Admin marks “Action required”', 'status_change', { status: 'action_required', message: 'We need additional information from you to proceed with this order. Please check your messages and respond.' }],
  ['Payments', 'Admin requests a payment', 'payment_request', { amount: 1725 }],
  ['Payments', 'Deposit paid (Stripe) or confirmed by admin', 'deposit_confirmed', {}],
  ['Payments', 'Admin requests the final payment', 'final_payment_required', {}],
  ['Payments', 'Final payment confirmed', 'final_payment_confirmed', {}],
  ['Payments', 'Admin sends an invoice', 'invoice', {}],
  ['Payments', 'Admin issues a refund', 'refund', {}],
  ['Samples', 'Admin sets sample pricing', 'sample_pricing', {}],
  ['Samples', 'Sample payment confirmed (Stripe)', 'sample_paid', {}],
  ['Samples', 'Admin uploads sample photos', 'sample_photos', {}],
  ['Samples', 'Admin adjusts physical sample quantity', 'sample_qty', { message: 'We’ve adjusted the number of physical samples to 4. Reason: Minimum per colorway is 2.\n\nUpdated total: $100.00 (4 × $25.00)' }],
  ['Samples', 'Admin confirms samples shipped', 'samples_shipped', {}],
  ['Production & delivery', 'Admin changes status (e.g. Quality Check)', 'status_change', { status: 'quality_check', message: 'Production is complete. Every unit is now being inspected before packing.' }],
  ['Production & delivery', 'Status → In transit', 'status_change', { status: 'in_transit' }],
  ['Production & delivery', 'Status → Delivered', 'status_change', { status: 'delivered' }],
  ['Production & delivery', 'Admin cancels the order', 'cancelled', {}],
  ['Production & delivery', 'Admin reactivates a cancelled order', 'reactivated', {}],
  ['Messages', 'Merchin team sends a message', 'new_message', { message: 'Hi Kyle! Samples are back from the factory and look great. We uploaded photos to your order — let us know if you would like any changes before production.' }],
];

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
let group = '';
const cards = cases.map(([g, when, event, extra]) => {
  const e = renderClientEmail(event, { order, recipientName: 'Kyle Dou', baseUrl: 'https://www.merchin.co', ...extra });
  const head = g !== group ? `<h2 style="font:700 20px Inter,Arial;margin:40px 0 4px;color:#171717">${(group = g)}</h2>` : '';
  return `${head}<div style="margin:18px 0 30px;border:1px solid #e5e5e5;border-radius:14px;overflow:hidden;background:#fff">
<div style="padding:14px 18px;border-bottom:1px solid #eee;font:13px/1.6 Inter,Arial"><div><b>When:</b> ${esc(when)}</div><div><b>Subject:</b> ${esc(e.subject)}</div></div>
<iframe style="width:100%;height:760px;border:0;display:block" srcdoc="${esc(e.html)}"></iframe></div>`;
});

const intro = `<div style="background:#171717;color:#fff;padding:28px 24px;border-radius:14px">
<div style="font:700 22px Inter,Arial">Client order emails</div>
<p style="font:14px/1.6 Inter,Arial;color:#d4d4d4;margin-top:8px">These are the exact emails clients receive, rendered with a sample order. They send from noreply@merchin.co with no reply address; every email links to the order in the portal. Clients can turn order-update and message emails on or off under Notification Preferences.</p></div>`;
writeFileSync(process.argv[2], `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Merchin client emails</title></head><body style="margin:0;background:#fafafa"><div style="max-width:680px;margin:0 auto;padding:24px 14px">${intro}${cards.join('')}</div></body></html>`);
console.log(cases.length, 'emails');
