import { clerkClient as getClerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

import { sql } from '@/lib/db';
import { stripe } from '@/lib/stripe';

function getPrimaryEmail(user: any): string | undefined {
  const primaryId = user?.primaryEmailAddressId;
  return user?.emailAddresses?.find((entry: any) => entry.id === primaryId)
    ?.emailAddress;
}

async function loadDbStripeCustomerId(userId: string) {
  const rows = await sql`
    select stripe_customer_id
    from "User"
    where id = ${userId}
    limit 1
  `;

  return rows[0]?.stripe_customer_id ?? null;
}

async function persistDbStripeCustomerId(params: {
  customerId: string;
  userId: string;
}) {
  const { customerId, userId } = params;

  await sql`
    update "User"
    set stripe_customer_id = ${customerId}
    where id = ${userId}
      and stripe_customer_id is distinct from ${customerId}
  `;
}

async function persistClerkStripeCustomerId(params: {
  customerId: string;
  user?: any;
  userId: string;
}) {
  const { customerId, userId } = params;
  let { user } = params;

  const currentClerkCustomerId = (user?.privateMetadata as any)?.stripeCustomerId;
  if (currentClerkCustomerId === customerId) {
    return;
  }

  const clerk = await getClerkClient();

  if (!user) {
    try {
      user = await clerk.users.getUser(userId);
    } catch {
      return;
    }
  }

  const latestClerkCustomerId = (user?.privateMetadata as any)?.stripeCustomerId;
  if (latestClerkCustomerId === customerId) {
    return;
  }

  try {
    await clerk.users.updateUser(userId, {
      privateMetadata: {
        ...(user?.privateMetadata || {}),
        stripeCustomerId: customerId,
      },
    });
  } catch {
      // Silent sync failure: BDD remains the source of truth.
  }
}

async function persistStripeCustomerId(params: {
  customerId: string;
  user?: any;
  userId: string;
}) {
  await persistDbStripeCustomerId(params);
  await persistClerkStripeCustomerId(params);
}

export async function resolveStripeCustomerId(params: {
  userId: string;
  user?: any;
  sessionId?: string;
}) {
  const { sessionId, userId } = params;
  const { user } = params;

  const dbCustomerId = await loadDbStripeCustomerId(userId);
  if (dbCustomerId) {
    await persistClerkStripeCustomerId({
      customerId: dbCustomerId,
      user,
      userId,
    });
    return dbCustomerId;
  }

  const clerkCustomerId = (user?.privateMetadata as any)?.stripeCustomerId as
    | string
    | undefined;
  if (clerkCustomerId) {
    await persistDbStripeCustomerId({
      customerId: clerkCustomerId,
      userId,
    });
    return clerkCustomerId;
  }

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer'],
      });
      const customer = session.customer;
      const sessionCustomerId =
        typeof customer === 'string' ? customer : (customer as Stripe.Customer).id;

      if (sessionCustomerId) {
        await persistStripeCustomerId({
          customerId: sessionCustomerId,
          user,
          userId,
        });
        return sessionCustomerId;
      }
    } catch {
      // Silent: we'll try the softer fallback below.
    }
  }

  const email = getPrimaryEmail(user);
  if (!email) {
    return null;
  }

  try {
    const found = await stripe.customers.search({
      query: `email:'${email.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    const foundCustomerId = found.data[0]?.id;

    if (!foundCustomerId) {
      return null;
    }

    await persistStripeCustomerId({
      customerId: foundCustomerId,
      user,
      userId,
    });
    return foundCustomerId;
  } catch {
    return null;
  }
}
