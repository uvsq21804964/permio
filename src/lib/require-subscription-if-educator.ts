import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { sql } from '@/lib/db';
import { hasSubscriptionFeatureAccess } from '@/lib/server/subscription-access';
import {
  syncStripeSubscriptionStateForUser,
  syncStripeSubscriptionStatesForUsers,
} from '@/lib/server/stripe-subscription-state';

type MeRow = {
  agencyId: string | null;
  id: string;
  in_grace: boolean;
  role: string;
  stripe_customer_id: string | null;
  subscription_current_period_end: Date | null;
  subscription_status: string | null;
};

type InstructorRow = {
  id: string;
  in_grace: boolean;
  stripe_customer_id: string | null;
  subscription_current_period_end: Date | null;
  subscription_status: string | null;
};

function withLocale(locale: string, path: string) {
  const safeLocale = locale?.trim() || 'en';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${safeLocale}${cleanPath}`;
}

function redirectForRole(role: string, locale: string) {
  if (role === 'instructor') {
    redirect(withLocale(locale, '/plans?reason=subscription'));
  }

  redirect(withLocale(locale, '/profile?reason=subscription'));
}

export async function requirePaidSubscriptionForAgency(locale: string) {
  const { userId } = await auth();
  if (!userId) {
    redirect(withLocale(locale, '/sign-in'));
  }

  const meRes = await sql`
    select
      id,
      role,
      "agencyId" as "agencyId",
      stripe_customer_id,
      subscription_status,
      subscription_current_period_end,
      ("createdAt" >= (now()::timestamp - interval '1 month')) as in_grace
    from "User"
    where id = ${userId}
    limit 1
  `;
  const me = meRes[0] as MeRow | undefined;
  if (!me) {
    redirect(withLocale(locale, '/sign-in'));
  }

  if (me.role === 'instructor') {
    const liveState = me.stripe_customer_id
      ? await syncStripeSubscriptionStateForUser(userId).catch(() => null)
      : null;

    if (
      !hasSubscriptionFeatureAccess({
        currentPeriodEnd:
          liveState?.subscription_current_period_end ??
          me.subscription_current_period_end,
        inGrace: me.in_grace,
        subscriptionStatus:
          liveState?.subscription_status ?? me.subscription_status,
      })
    ) {
      redirectForRole(me.role, locale);
    }
    return;
  }

  if (!me.agencyId) {
    redirectForRole(me.role, locale);
  }

  const instructors = (await sql`
    select
      id,
      stripe_customer_id,
      subscription_status,
      subscription_current_period_end,
      ("createdAt" >= (now()::timestamp - interval '1 month')) as in_grace
    from "User"
    where "agencyId" = ${me.agencyId}
      and role = 'instructor'
    limit 10
  `) as InstructorRow[];

  if (instructors.length === 0) {
    redirectForRole(me.role, locale);
  }

  const hasAllowedInstructor = instructors.some((instructor) =>
    hasSubscriptionFeatureAccess({
      currentPeriodEnd: instructor.subscription_current_period_end,
      inGrace: instructor.in_grace,
      subscriptionStatus: instructor.subscription_status,
    }),
  );

  const syncedInstructorStates = await syncStripeSubscriptionStatesForUsers(
    instructors
      .filter((instructor) => instructor.stripe_customer_id)
      .map((instructor) => instructor.id)
  );

  const hasAllowedInstructorAfterSync = instructors.some((instructor) => {
    const liveState = syncedInstructorStates.get(instructor.id);
    return hasSubscriptionFeatureAccess({
      currentPeriodEnd:
        liveState?.subscription_current_period_end ??
        instructor.subscription_current_period_end,
      inGrace: instructor.in_grace,
      subscriptionStatus:
        liveState?.subscription_status ?? instructor.subscription_status,
    });
  });

  if (!hasAllowedInstructor && !hasAllowedInstructorAfterSync) {
    redirectForRole(me.role, locale);
  }
}
