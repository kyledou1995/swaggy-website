import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { orderId, orderNumber, amount, customerEmail, paymentType } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'https://swaggy-website.vercel.app';
    const type = paymentType || 'deposit';

    const isSample = type === 'sample';
    const productName = isSample
      ? `Sample Payment — Order #${orderNumber}`
      : `30% Deposit — Order #${orderNumber}`;
    const productDescription = isSample
      ? `Sample payment for Swaggy order #${orderNumber}`
      : `Deposit payment for Swaggy order #${orderNumber}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'us_bank_account'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId,
        orderNumber,
        type,
      },
      payment_intent_data: {
        metadata: {
          orderId,
          orderNumber,
          type,
        },
      },
      success_url: `${baseUrl}/portal/orders/${orderId}?payment=success&type=${type}`,
      cancel_url: `${baseUrl}/portal/orders/${orderId}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
