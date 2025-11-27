// /app/api/stripe/invoices/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const user = await currentUser();
  const customerId = (user?.privateMetadata as any)?.stripeCustomerId as
    | string
    | undefined;
  if (!customerId) return NextResponse.json({ data: [] });

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });
  return NextResponse.json(invoices);
}
