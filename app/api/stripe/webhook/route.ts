// /app/api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

function toDateFromUnix(unixSeconds?: number | null) {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

function getCustomerId(customer: unknown): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  if (typeof customer === 'object' && customer !== null && 'id' in customer) {
    return (customer as any).id ?? null;
  }
  return null;
}

async function findUserIdFromCustomerId(customerId: string) {
  const res = await sql`
    select id
    from "User"
    where stripe_customer_id = ${customerId}
    limit 1
  `;
  return res[0]?.id ?? null;
}

async function updateSubscriptionInDb(params: {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
}) {
  const {
    userId,
    customerId,
    subscriptionId,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = params;

  await sql`
    update "User"
    set
      stripe_customer_id = coalesce(${customerId}, stripe_customer_id),
      stripe_subscription_id = ${subscriptionId},
      subscription_status = ${status},
      subscription_current_period_end = ${currentPeriodEnd},
      subscription_cancel_at_period_end = coalesce(${cancelAtPeriodEnd}, subscription_cancel_at_period_end)
    where id = ${userId}
  `;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature' },
      { status: 400 }
    );
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      /**
       * ✅ Indispensable : gère le mois gratuit (trialing) + changements d’état
       * (active / past_due / canceled / unpaid / etc.)
       */
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = getCustomerId((sub as any).customer);
        if (!customerId) break;

        // 1) idéal : sub.metadata.clerkUserId (si tu le mets à la création)
        let userId: string | null =
          ((sub as any).metadata?.clerkUserId as string | undefined) ?? null;

        // 2) fallback via BDD (customerId -> user)
        if (!userId) {
          userId = await findUserIdFromCustomerId(customerId);
        }
        if (!userId) break;

        // ⚠️ accès via "any" pour éviter les erreurs TS liées à ta version Stripe
        const currentPeriodEndUnix = (sub as any).current_period_end as
          | number
          | null
          | undefined;
        const cancelAtPeriodEnd =
          ((sub as any).cancel_at_period_end as boolean | null | undefined) ??
          null;
        const status =
          ((sub as any).status as string | null | undefined) ?? null;

        await updateSubscriptionInDb({
          userId,
          customerId,
          subscriptionId: (sub as any).id ?? null,
          status,
          currentPeriodEnd: toDateFromUnix(currentPeriodEndUnix),
          cancelAtPeriodEnd,
        });

        break;
      }

      /**
       * Optionnel : tu peux garder, mais ce n’est PAS suffisant pour le trial.
       * En pratique, les events subscription.* sont la source de vérité.
       */
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        const customerId = getCustomerId((invoice as any).customer);
        if (!customerId) break;

        const userId = await findUserIdFromCustomerId(customerId);
        if (!userId) break;

        // On laisse subscription.updated faire le job.
        // Si tu veux absolument sync ici, tu peux retrieve la subscription (si présente).
        const subscriptionId = (invoice as any).subscription as
          | string
          | null
          | undefined;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const currentPeriodEndUnix = (sub as any).current_period_end as
          | number
          | null
          | undefined;
        const cancelAtPeriodEnd =
          ((sub as any).cancel_at_period_end as boolean | null | undefined) ??
          null;
        const status =
          ((sub as any).status as string | null | undefined) ?? null;

        await updateSubscriptionInDb({
          userId,
          customerId,
          subscriptionId: (sub as any).id ?? null,
          status,
          currentPeriodEnd: toDateFromUnix(currentPeriodEndUnix),
          cancelAtPeriodEnd,
        });

        break;
      }

      case 'invoice.payment_failed': {
        // Pas obligatoire : laisse subscription.updated gérer (past_due/unpaid)
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
