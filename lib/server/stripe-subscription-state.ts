import Stripe from 'stripe';

import { sql } from '@/lib/db';
import { stripe } from '@/lib/stripe';

type StripeBackedUserRow = {
  stripe_customer_id: string | null;
  subscription_cancel_at_period_end: boolean | null;
  subscription_current_period_end: Date | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
};

type SyncedSubscriptionState = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_cancel_at_period_end: boolean;
  subscription_current_period_end: Date | null;
  subscription_status: string | null;
};

const SUBSCRIPTION_PRIORITY: Stripe.Subscription.Status[] = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused',
  'canceled',
];

function toDateFromUnix(unixSeconds?: number | null) {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

function getSubscriptionPriority(status: string) {
  const index = SUBSCRIPTION_PRIORITY.indexOf(
    status as Stripe.Subscription.Status
  );
  return index === -1 ? 999 : index;
}

function pickBestSubscription(subscriptions: Stripe.Subscription[]) {
  return subscriptions
    .slice()
    .sort((left, right) => {
      const byStatus =
        getSubscriptionPriority(left.status) -
        getSubscriptionPriority(right.status);

      if (byStatus !== 0) {
        return byStatus;
      }

      const leftPeriodEnd = ((left as any).current_period_end as number | null) ?? 0;
      const rightPeriodEnd =
        ((right as any).current_period_end as number | null) ?? 0;

      return rightPeriodEnd - leftPeriodEnd;
    })[0];
}

async function loadStripeBackedUserRow(userId: string) {
  const rows = await sql`
    select
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      subscription_current_period_end,
      subscription_cancel_at_period_end
    from "User"
    where id = ${userId}
    limit 1
  `;

  return (rows[0] as StripeBackedUserRow | undefined) ?? null;
}

async function persistSyncedSubscriptionState(params: {
  customerId: string | null;
  state: SyncedSubscriptionState;
  userId: string;
}) {
  const { customerId, state, userId } = params;

  await sql`
    update "User"
    set
      stripe_customer_id = coalesce(${customerId}, stripe_customer_id),
      stripe_subscription_id = ${state.stripe_subscription_id},
      subscription_status = ${state.subscription_status},
      subscription_current_period_end = ${state.subscription_current_period_end},
      subscription_cancel_at_period_end = ${state.subscription_cancel_at_period_end}
    where id = ${userId}
  `;
}

export async function syncStripeSubscriptionStateForUser(userId: string) {
  const row = await loadStripeBackedUserRow(userId);
  if (!row?.stripe_customer_id) {
    return row;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: row.stripe_customer_id,
    status: 'all',
    limit: 10,
  });

  const picked = pickBestSubscription(subscriptions.data);
  const nextState: SyncedSubscriptionState = picked
    ? {
        stripe_customer_id: row.stripe_customer_id,
        stripe_subscription_id: picked.id,
        subscription_cancel_at_period_end: Boolean(
          (picked as any).cancel_at_period_end
        ),
        subscription_current_period_end: toDateFromUnix(
          (picked as any).current_period_end
        ),
        subscription_status: picked.status,
      }
    : {
        stripe_customer_id: row.stripe_customer_id,
        stripe_subscription_id: null,
        subscription_cancel_at_period_end: false,
        subscription_current_period_end: null,
        subscription_status: null,
      };

  const hasChanged =
    row.stripe_subscription_id !== nextState.stripe_subscription_id ||
    row.subscription_status !== nextState.subscription_status ||
    row.subscription_cancel_at_period_end !==
      nextState.subscription_cancel_at_period_end ||
    row.subscription_current_period_end?.getTime() !==
      nextState.subscription_current_period_end?.getTime();

  if (hasChanged) {
    await persistSyncedSubscriptionState({
      customerId: row.stripe_customer_id,
      state: nextState,
      userId,
    });
  }

  return nextState;
}

export async function syncStripeSubscriptionStatesForUsers(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const results = await Promise.all(
    uniqueUserIds.map(async (userId) => ({
      userId,
      state: await syncStripeSubscriptionStateForUser(userId).catch(() => null),
    }))
  );

  return new Map(results.map((entry) => [entry.userId, entry.state]));
}
