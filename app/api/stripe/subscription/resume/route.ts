// app/api/stripe/subscription/resume/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const form = await req.formData();
  const subscriptionId = String(form.get('subscriptionId') || '');
  const returnUrl = String(form.get('returnUrl') || '/billing');

  if (!subscriptionId)
    return new NextResponse('Missing subscriptionId', { status: 400 });

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return NextResponse.redirect(returnUrl, { status: 303 });
}
