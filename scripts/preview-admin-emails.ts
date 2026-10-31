/* Renders every admin email with sample data: npx tsx scripts/preview-admin-emails.ts out.html */
import { writeFileSync } from 'fs';
import { renderAdminEmail, type AdminEmailEvent } from '../src/lib/admin-emails';
import type { Order } from '../src/types';

const order = {
  id: '00000000-0000-0000-0000-000000000000', client_id: 'x', order_number: 'MRC-104237', status: 'submitted',
  product_type: 'Bags & Totes', product_description: 'Natural canvas tote, 2-color screen print on front, 15" x 16" with 4" gusset.',
  quantity: 1000, target_price: 6, target_delivery_date: '2026-12-31', notes: '', created_at: '', updated_at: '',
  quote_air_price_per_unit: 8.4, quote_ocean_price_per_unit: 5.75, selected_shipping: 'ocean', deposit_amount: 1725, deposit_paid: true,
  sample_quantity_requested: 3, packaging_required: true, cancellation_reason: 'Budget was reallocated this quarter.',
} as unknown as Order;
const client = { full_name: 'Kyle Dou', company_name: '4am Ship Inc', email: 'kyle@4amship.com' };

const cases: [string, AdminEmailEvent, Record<string, unknown>][] = [
  ['Client submits a new order', 'new_order', {}],
  ['Client sends a message', 'new_message', { message: 'Can we go one shade darker on the ink? Also, is there any way to get these by Dec 15?' }],
  ['Client accepts a quote (chooses air or ocean)', 'quote_accepted', {}],
  ['Client approves sample pricing', 'sample_pricing_approved', { message: 'Kyle Dou approved sample pricing. 3 sample(s) at $25.00 each. Total: $75.00.' }],
  ['Client pays for samples (Stripe)', 'sample_paid', { amount: 75 }],
  ['Client requests physical samples', 'physical_samples_requested', {}],
  ['Client approves samples', 'sample_approved', {}],
  ['Client requests sample changes', 'sample_changes_requested', { message: 'Logo needs to be 1 inch higher and the handles should be black.' }],
  ['Client pays the deposit (Stripe)', 'deposit_paid', { amount: 1725 }],
  ['Client pays the final balance (Stripe)', 'final_payment_paid', { amount: 4025 }],
  ['Client cancels the order', 'order_cancelled', {}],
];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const cards = cases.map(([when, event, extra]) => {
  const e = renderAdminEmail(event, { order, client, baseUrl: 'https://www.merchin.co', ...extra });
  return `<div style="margin:18px 0 30px;border:1px solid #e5e5e5;border-radius:14px;overflow:hidden;background:#fff">
<div style="padding:14px 18px;border-bottom:1px solid #eee;font:13px/1.6 Inter,Arial"><div><b>When:</b> ${esc(when)}</div><div><b>Subject:</b> ${esc(e.subject)}</div></div>
<iframe style="width:100%;height:720px;border:0;display:block" srcdoc="${esc(e.html)}"></iframe></div>`;
});
const intro = `<div style="background:#171717;color:#fff;padding:28px 24px;border-radius:14px">
<div style="font:700 22px Inter,Arial">Admin order emails</div>
<p style="font:14px/1.6 Inter,Arial;color:#d4d4d4;margin-top:8px">Sent to every admin when a client does something on an order. Rendered with a sample order. Each email links straight to the order in the admin portal.</p></div>`;
writeFileSync(process.argv[2], `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Merchin admin emails</title></head><body style="margin:0;background:#fafafa"><div style="max-width:680px;margin:0 auto;padding:24px 14px">${intro}${cards.join('')}</div></body></html>`);
console.log(cases.length, 'emails');
