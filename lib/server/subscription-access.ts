const ACCESSIBLE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export function hasSubscriptionFeatureAccess(params: {
  currentPeriodEnd?: Date | null;
  inGrace?: boolean;
  subscriptionStatus?: string | null;
}) {
  const { currentPeriodEnd = null, inGrace = false, subscriptionStatus } = params;

  if (inGrace) {
    return true;
  }

  const normalizedStatus = (subscriptionStatus ?? '').trim().toLowerCase();
  if (!ACCESSIBLE_SUBSCRIPTION_STATUSES.has(normalizedStatus)) {
    return false;
  }

  if (!currentPeriodEnd) {
    return true;
  }

  return currentPeriodEnd.getTime() > Date.now();
}

export function isAccessibleStripeSubscriptionStatus(
  status: string | null | undefined,
) {
  return ACCESSIBLE_SUBSCRIPTION_STATUSES.has(
    (status ?? '').trim().toLowerCase(),
  );
}
