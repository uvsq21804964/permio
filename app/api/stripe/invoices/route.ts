// /app/api/stripe/invoices/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';
import { resolveStripeCustomerId } from '@/lib/server/stripe-customer';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const clerk = await getClerkClient();
  const user = await clerk.users.getUser(userId);
  const customerId = await resolveStripeCustomerId({ user, userId });
  if (!customerId) return NextResponse.json({ data: [] });

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });
  return NextResponse.json(invoices);
}
