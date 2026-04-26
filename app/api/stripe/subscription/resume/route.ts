// app/api/stripe/subscription/resume/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { stripe } from '@/lib/stripe';

function redirectWithError(returnUrl: string, errorCode: string) {
  return NextResponse.redirect(`${returnUrl}?error=${errorCode}`, {
    status: 303,
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const form = await req.formData();
  const subscriptionId = String(form.get('subscriptionId') || '');
  const returnUrl = String(form.get('returnUrl') || '/invoices');

  if (!subscriptionId) {
    return redirectWithError(returnUrl, 'missing_subscription');
  }

  const me = await sql`
    select stripe_customer_id
    from "User"
    where id = ${userId}
    limit 1
  `;
  const myCustomerId = me[0]?.stripe_customer_id ?? null;
  if (!myCustomerId) {
    return redirectWithError(returnUrl, 'missing_customer');
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const subCustomerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

    if (!subCustomerId || myCustomerId !== subCustomerId) {
      return redirectWithError(returnUrl, 'forbidden_subscription');
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error('[stripe/resume] error', error);
    return redirectWithError(returnUrl, 'resume_failed');
  }

  return NextResponse.redirect(returnUrl, { status: 303 });
}
