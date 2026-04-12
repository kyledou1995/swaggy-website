import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const type = searchParams.get('type') || 'deposit'; // deposit | full | custom

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get client info
    const { data: client } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.client_id)
      .single();

    const selectedPrice = order.selected_shipping === 'air'
      ? order.quote_air_price_per_unit
      : order.quote_ocean_price_per_unit;
    const totalOrderValue = (selectedPrice || 0) * order.quantity;
    const depositAmount = order.deposit_amount || totalOrderValue * 0.3;

    let invoiceAmount = 0;
    let invoiceTitle = '';
    let invoiceDescription = '';

    if (type === 'deposit') {
      invoiceAmount = depositAmount;
      invoiceTitle = 'Deposit Invoice';
      invoiceDescription = '30% deposit for order confirmation';
    } else if (type === 'full') {
      invoiceAmount = totalOrderValue;
      invoiceTitle = 'Full Order Invoice';
      invoiceDescription = 'Complete order total';
    } else if (type === 'balance') {
      invoiceAmount = totalOrderValue - (order.deposit_amount || 0);
      invoiceTitle = 'Balance Due Invoice';
      invoiceDescription = 'Remaining balance after deposit';
    }

    const invoiceNumber = `INV-${order.order_number || orderId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const shippingMethod = order.selected_shipping === 'air' ? 'DDP Air Freight' : order.selected_shipping === 'ocean' ? 'DDP Ocean Freight' : 'TBD';
    const productionDays = order.selected_shipping === 'air' ? order.quote_air_production_days : order.quote_ocean_production_days;
    const shippingDays = order.selected_shipping === 'air' ? order.quote_air_shipping_days : order.quote_ocean_shipping_days;

    // Generate HTML invoice
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${invoiceTitle} - ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #16a34a; }
    .logo { font-size: 28px; font-weight: 800; color: #16a34a; letter-spacing: -0.5px; }
    .logo-sub { font-size: 12px; color: #666; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 24px; color: #1a1a1a; margin-bottom: 8px; }
    .invoice-meta p { font-size: 13px; color: #666; line-height: 1.6; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .party { flex: 1; }
    .party-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 600; color: #1a1a1a; }
    .party-detail { font-size: 13px; color: #666; line-height: 1.6; }
    .order-ref { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 32px; display: flex; gap: 32px; }
    .order-ref-item { }
    .order-ref-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 1px; }
    .order-ref-value { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 1px; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; text-align: left; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }
    tbody td { padding: 14px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; }
    tbody td:last-child, tbody td:nth-child(2), tbody td:nth-child(3) { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
    .totals-row.total { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #1a1a1a; }
    .totals-row.paid { color: #16a34a; }
    .totals-row.refund { color: #dc2626; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-paid { background: #dcfce7; color: #16a34a; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-refunded { background: #fce4e4; color: #dc2626; }
    .notes { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
    .notes-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
    .notes-text { font-size: 13px; color: #666; line-height: 1.6; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #999; line-height: 1.6; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">swaggy</div>
      <div class="logo-sub">Sourcing Made Simple</div>
    </div>
    <div class="invoice-meta">
      <h2>${invoiceTitle}</h2>
      <p>
        Invoice #: <strong>${invoiceNumber}</strong><br>
        Date: ${invoiceDate}<br>
        Due: ${dueDate}
      </p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">From</div>
      <div class="party-name">Swaggy Inc.</div>
      <div class="party-detail">
        Sourcing &amp; Supply Chain<br>
        support@swaggy.com
      </div>
    </div>
    <div class="party">
      <div class="party-label">Bill To</div>
      <div class="party-name">${client?.company_name || 'Client'}</div>
      <div class="party-detail">
        ${client?.full_name || ''}<br>
        ${client?.email || ''}
      </div>
    </div>
  </div>

  <div class="order-ref">
    <div class="order-ref-item">
      <div class="order-ref-label">Order Number</div>
      <div class="order-ref-value">#${order.order_number || orderId.slice(0, 8)}</div>
    </div>
    <div class="order-ref-item">
      <div class="order-ref-label">Product</div>
      <div class="order-ref-value">${order.product_type}</div>
    </div>
    <div class="order-ref-item">
      <div class="order-ref-label">Shipping</div>
      <div class="order-ref-value">${shippingMethod}</div>
    </div>
    <div class="order-ref-item">
      <div class="order-ref-label">Lead Time</div>
      <div class="order-ref-value">${productionDays ? `${productionDays}d prod + ${shippingDays}d ship` : 'TBD'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${order.product_type}</strong><br>
          <span style="font-size:12px;color:#999">${order.product_description ? order.product_description.slice(0, 80) : ''}</span>
        </td>
        <td>${order.quantity.toLocaleString()}</td>
        <td>$${(selectedPrice || 0).toFixed(2)}</td>
        <td><strong>$${totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
      </tr>
      ${type === 'deposit' ? `
      <tr>
        <td colspan="3" style="text-align:right;color:#666">30% Deposit Required</td>
        <td><strong>$${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
      </tr>` : ''}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row">
        <span>Order Total</span>
        <span>$${totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      ${order.deposit_paid ? `
      <div class="totals-row paid">
        <span>Deposit Paid</span>
        <span>-$${(order.deposit_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      ${order.refund_issued ? `
      <div class="totals-row refund">
        <span>Refund Issued</span>
        <span>+$${(order.refund_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="totals-row total">
        <span>${invoiceDescription}</span>
        <span>$${invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>

  <div class="notes">
    <div class="notes-label">Payment Status</div>
    <div class="notes-text">
      ${order.deposit_paid
        ? `<span class="status-badge status-paid">Deposit Paid</span> on ${order.deposit_paid_at ? new Date(order.deposit_paid_at).toLocaleDateString() : 'N/A'}`
        : `<span class="status-badge status-pending">Payment Pending</span>`
      }
      ${order.refund_issued
        ? `<br><span class="status-badge status-refunded" style="margin-top:8px;display:inline-block">Refund Issued</span> $${(order.refund_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${order.refund_issued_at ? new Date(order.refund_issued_at).toLocaleDateString() : 'N/A'}`
        : ''
      }
    </div>
  </div>

  ${order.stripe_payment_intent_id ? `
  <div class="notes">
    <div class="notes-label">Payment Reference</div>
    <div class="notes-text">Stripe Payment ID: ${order.stripe_payment_intent_id}</div>
  </div>` : ''}

  <div class="footer">
    <p>
      Thank you for your business!<br>
      Questions? Contact us at support@swaggy.com
    </p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${invoiceNumber}.html"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate invoice' }, { status: 500 });
  }
}
