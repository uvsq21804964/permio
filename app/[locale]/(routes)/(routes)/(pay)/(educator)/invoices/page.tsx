// app/[locale]/(routes)/(routes)/invoices/page.tsx
export const runtime = 'nodejs'; // Stripe SDK = Node (pas d’Edge)

import { sql } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

import type { Locale } from '@/src/lib/i18n';
import { getMessages } from '@/src/i18n/getMessages';

type SubWithPeriods = Stripe.Subscription;

type DbMeRow = {
  role: string;
  agencyId: string;
  createdAt: string | Date;
};

type DbInstructorRow = {
  createdAt: string | Date;
};

function addOneMonth(d: Date) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + 1);
  return copy;
}

function toDate(value: any): Date {
  if (!value) return new Date(0);
  return value instanceof Date ? value : new Date(value);
}

function mapPlanName(raw?: string | null) {
  if (!raw) return '—';
  const k = String(raw).toLowerCase();
  if (k.startsWith('starter')) return 'Starter';
  if (k.startsWith('pro')) return 'Pro';
  if (k.startsWith('magic')) return 'Full Magic';
  return raw;
}

// localeTag = 'fr-FR' | 'en-US'...
function formatCentsToCurrency(
  cents: number,
  currency = 'eur',
  localeTag: string = 'fr-FR'
) {
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function getPrimaryEmail(user: any): string | undefined {
  const id = user?.primaryEmailAddressId;
  return user?.emailAddresses?.find((e: any) => e.id === id)?.emailAddress;
}

// Petit helper pour lire les clés "a.b.c" dans le JSON + interpolation {var}
function createTranslator(dict: any) {
  return (
    path: string,
    vars?: Record<string, string | number | null | undefined>
  ): string => {
    const parts = path.split('.');
    let current: any = dict;
    for (const p of parts) current = current?.[p];

    let s = typeof current === 'string' ? current : path;

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.split(`{${k}}`).join(v == null ? '' : String(v));
      }
    }
    return s;
  };
}

// ---- UI helpers (charte)
const cardBase =
  'rounded-2xl border border-black/10 bg-white/85 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur';
const cardPadding = 'p-6 md:p-8';
const btnBase =
  'inline-flex items-center justify-center rounded-xl border text-sm font-semibold px-4 py-2 motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2';
const btnPrimary = `${btnBase} bg-white/95 text-black border-black/25 hover:bg-white`;
const btnGhost = `${btnBase} bg-transparent text-black border-black/20 hover:bg-white/70`;
const btnDanger = `${btnBase} bg-white/95 text-red-700 border-red-300 hover:bg-white`;
const btnMagic =
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold px-4 py-2 text-white border-0 shadow-sm bg-gradient-to-r from-primary to-[#d400ff] hover:opacity-95 motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A1B9A]/70 focus-visible:ring-offset-2';

const badgeBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium';
const badgeMuted = `${badgeBase} border-black/15 bg-white/80 text-black/70`;
const badgePositive = `${badgeBase} border-emerald-300 bg-emerald-50 text-emerald-800`;
const badgeWarning = `${badgeBase} border-amber-300 bg-amber-50 text-amber-800`;
const badgeNeutral = `${badgeBase} border-black/15 bg-white/80 text-black/70`;

export default async function BillingPage({
  searchParams,
  params,
}: {
  searchParams?: Promise<{ session_id?: string | string[] }>;
  params: { locale: Locale };
}) {
  const locale = params.locale ?? 'fr';
  const localeTag = locale === 'fr' ? 'fr-FR' : 'en-US';

  const allMessages = await getMessages(locale);
  const t = createTranslator(allMessages.billing);

  // --- Auth
  const { userId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in`);

  // --- BDD: fin de période d’essai (1 mois après création du compte instructor)
  const meDbRes = await sql`
    select
      role,
      "agencyId" as "agencyId",
      "createdAt" as "createdAt"
    from "User"
    where id = ${userId}
    limit 1
  `;
  const meDb = meDbRes[0] as DbMeRow | undefined;
  if (!meDb) redirect(`/${locale}/sign-in`);

  let instructorCreatedAt = toDate(meDb.createdAt);

  if (meDb.role !== 'instructor') {
    const insRes = await sql`
      select "createdAt" as "createdAt"
      from "User"
      where "agencyId" = ${meDb.agencyId}
        and role = 'instructor'
      order by "createdAt" asc
      limit 1
    `;
    const ins = insRes[0] as DbInstructorRow | undefined;
    if (ins?.createdAt) instructorCreatedAt = toDate(ins.createdAt);
  }

  // ✅ Trial BDD (source of truth)
  const trialRes = await sql`
    select
      (case
        when ${meDb.role} = 'instructor'
          then (select "createdAt" from "User" where id = ${userId} limit 1)
        else (select min("createdAt") from "User" where "agencyId" = ${meDb.agencyId} and role = 'instructor')
      end) as "trialStart",
      (case
        when ${meDb.role} = 'instructor'
          then (select "createdAt" from "User" where id = ${userId} limit 1)
        else (select min("createdAt") from "User" where "agencyId" = ${meDb.agencyId} and role = 'instructor')
      end + interval '1 month') as "trialEnd",
      (now() < (case
        when ${meDb.role} = 'instructor'
          then (select "createdAt" from "User" where id = ${userId} limit 1)
        else (select min("createdAt") from "User" where "agencyId" = ${meDb.agencyId} and role = 'instructor')
      end + interval '1 month')) as "isInTrial"
  `;

  const row = (trialRes?.[0] ?? {}) as any;

  const trialStartDb = row.trialStart
    ? toDate(row.trialStart)
    : instructorCreatedAt;
  const trialEndDb = row.trialEnd
    ? toDate(row.trialEnd)
    : addOneMonth(trialStartDb);
  const trialEndDbLabel = trialEndDb.toLocaleDateString(localeTag);

  const isInDbTrialWindow =
    Boolean(row.isInTrial) && Date.now() < trialEndDb.getTime();

  const DAY_MS = 1000 * 60 * 60 * 24;

  function makeDaysLeftText(locale: string, days: number) {
    if (locale === 'en') return `${days} day${days > 1 ? 's' : ''} left`;
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
  }

  function makeUntilText(locale: string, dateLabel: string) {
    if (!dateLabel) return '';
    return locale === 'en' ? `Until ${dateLabel}` : `Jusqu’au ${dateLabel}`;
  }

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function computeProgressPct(startMs?: number | null, endMs?: number | null) {
    if (!startMs || !endMs || endMs <= startMs) return 0;
    const now = Date.now();
    const pct = ((now - startMs) / (endMs - startMs)) * 100;
    return Math.round(clamp(pct, 0, 100));
  }

  // Next.js 15: searchParams est async dyn
  const sp = (await searchParams) || {};
  const sessionId = Array.isArray(sp.session_id)
    ? sp.session_id[0]
    : sp.session_id;

  // --- Clerk user
  const clerk = await getClerkClient();
  let user: any;
  try {
    user = await clerk.users.getUser(userId);
  } catch {
    redirect(`/${locale}/sign-in`);
  }

  // --- Stripe customerId
  let customerId = (user?.privateMetadata as any)?.stripeCustomerId as
    | string
    | undefined;

  // 1) Hydrate via session_id (retour Checkout)
  if (!customerId && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer'],
      });
      const cust = session.customer;
      const cid =
        typeof cust === 'string' ? cust : (cust as Stripe.Customer).id;
      if (cid) {
        await clerk.users.updateUser(userId, {
          privateMetadata: {
            ...(user?.privateMetadata || {}),
            stripeCustomerId: cid,
          },
        });
        customerId = cid;
      }
    } catch {
      // silencieux
    }
  }

  // 2) Fallback: recherche par email Stripe
  if (!customerId) {
    const email = getPrimaryEmail(user);
    if (email) {
      try {
        const found = await stripe.customers.search({
          query: `email:'${email.replace(/'/g, "\\'")}'`,
          limit: 1,
        });
        const foundCustomer = found.data[0];
        if (foundCustomer?.id) {
          await clerk.users.updateUser(userId, {
            privateMetadata: {
              ...(user?.privateMetadata || {}),
              stripeCustomerId: foundCustomer.id,
            },
          });
          customerId = foundCustomer.id;
        }
      } catch {
        // ignore
      }
    }
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices?success=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices?canceled=1`;

  // --- État sans client Stripe → trial BDD only
  if (!customerId) {
    const SHOW_SUBSCRIBE_BEFORE_DAYS = 7;

    const msLeft = trialEndDb.getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / DAY_MS);

    const showSubscribeCTA =
      !isInDbTrialWindow || daysLeft <= SHOW_SUBSCRIBE_BEFORE_DAYS;

    let trialText = '';
    if (isInDbTrialWindow) {
      trialText =
        daysLeft <= SHOW_SUBSCRIBE_BEFORE_DAYS
          ? t('noCustomer.trialEndsSoon', {
              date: trialEndDbLabel,
              days: daysLeft,
            })
          : t('noCustomer.trialActiveUntil', { date: trialEndDbLabel });
    } else {
      trialText = t('noCustomer.trialEnded', { date: trialEndDbLabel });
    }

    return (
      <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="break-words" style={{ hyphens: 'auto' }}>
            <h1 className="text-2xl md:text-3xl font-semibold text-black">
              {t('header.title')}
            </h1>
            <p className="mt-2 text-sm text-black/70">
              {t('noCustomer.description')}
            </p>
            <p className="mt-3 text-sm text-black/80">{trialText}</p>
          </header>

          <section className={`${cardBase} ${cardPadding}`}>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/${locale}/plans?from=billing`} className={btnMagic}>
                {t('actions.comparePlans')}
              </Link>
            </div>

            {!showSubscribeCTA && (
              <p className="mt-3 text-xs text-black/60">
                {t('noCustomer.ctaHiddenHint')}
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  // -------- Stripe: récupérer une subscription pertinente puis RETRIEVE
  let sub: SubWithPeriods | undefined;

  try {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const PRIORITY: Stripe.Subscription.Status[] = [
      'active',
      'trialing',
      'past_due',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused',
      'canceled',
    ];

    const picked = list.data.slice().sort((a, b) => {
      const pa = PRIORITY.indexOf(a.status);
      const pb = PRIORITY.indexOf(b.status);
      return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
    })[0];

    if (picked?.id) {
      sub = (await stripe.subscriptions.retrieve(picked.id, {
        expand: ['items.data.price'],
      })) as SubWithPeriods;
    }
  } catch {
    // sub undefined
  }

  const hasSub = Boolean(sub?.id);
  const subId = sub?.id;
  const status = sub?.status ?? 'none';

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });

  // ---------- Flags
  const rawCancelScheduled = Boolean((sub as any)?.cancel_at_period_end);
  const isCancelScheduled = rawCancelScheduled && !isInDbTrialWindow;

  const isCanceled =
    !hasSub || status === 'canceled' || Boolean((sub as any)?.ended_at);

  // ---------- Plan / prix
  let planLabel = '—';
  let amount = 0;
  let currency = 'EUR';
  let interval: 'day' | 'week' | 'month' | 'year' | 'unknown' = 'month';

  const price = (sub?.items?.data?.[0]?.price ?? null) as Stripe.Price | null;
  if (price) {
    amount = price.unit_amount ?? 0;
    currency = (price.currency || 'eur').toUpperCase();
    interval = price.recurring?.interval ?? 'month';

    const rawPlan = price.nickname || price.lookup_key || '—';
    planLabel = mapPlanName(rawPlan);

    if (planLabel === rawPlan && planLabel === '—' && price.product) {
      const productId =
        typeof price.product === 'string' ? price.product : price.product.id;
      try {
        const product = await stripe.products.retrieve(productId);
        planLabel = product.name || planLabel;
      } catch {
        /* ignore */
      }
    }
  }

  const currentPlanRaw = (price?.lookup_key ?? price?.nickname ?? '') as string;
  const currentPlan = String(currentPlanRaw).toLowerCase();
  const isCurrentMagic = currentPlan.startsWith('magic');

  const intervalLabel =
    interval === 'year'
      ? t('subscription.interval.year')
      : t('subscription.interval.month');

  // ---------- Dates Stripe
  const currentPeriodEndSec = (sub as any)?.current_period_end as
    | number
    | undefined;
  const currentPeriodStartSec = (sub as any)?.current_period_start as
    | number
    | undefined;

  const stripePeriodStartMs = currentPeriodStartSec
    ? currentPeriodStartSec * 1000
    : null;
  const stripePeriodEndMs = currentPeriodEndSec
    ? currentPeriodEndSec * 1000
    : null;

  // ✅ Preview invoice (prochain paiement / fallback)
  let previewInvoice: Stripe.Invoice | null = null;
  if (subId) {
    try {
      previewInvoice = await stripe.invoices.createPreview({
        customer: customerId,
        subscription: subId,
      });
    } catch {
      previewInvoice = null;
    }
  }

  const periodEndFromPreview = (() => {
    const v = (previewInvoice as any)?.period_end;
    return typeof v === 'number' ? v : null;
  })();

  const lineEndForSub =
    previewInvoice?.lines?.data?.find((l: any) => l.subscription === subId)
      ?.period?.end ?? null;

  const lineEndFirst = previewInvoice?.lines?.data?.[0]?.period?.end ?? null;

  const nextPaymentSec: number | null =
    currentPeriodEndSec ??
    previewInvoice?.next_payment_attempt ??
    periodEndFromPreview ??
    lineEndForSub ??
    lineEndFirst ??
    null;

  const stripeNextPaymentLabel = nextPaymentSec
    ? new Date(nextPaymentSec * 1000).toLocaleDateString(localeTag)
    : '';

  const nextPaymentLabel =
    locale === 'en' ? 'Next payment' : 'Prochain paiement';
  const noNextPaymentText =
    locale === 'en' ? 'No payment scheduled' : 'Aucun paiement prévu';

  let nextPaymentValue = stripeNextPaymentLabel || noNextPaymentText;
  if (isCancelScheduled || isCanceled) nextPaymentValue = noNextPaymentText;

  // ended/canceled date
  const endedAtSec =
    (sub as any)?.ended_at ??
    (sub as any)?.canceled_at ??
    currentPeriodEndSec ??
    undefined;

  const endedOnLabel = endedAtSec
    ? new Date(endedAtSec * 1000).toLocaleDateString(localeTag)
    : '';

  const inactiveTitle =
    locale === 'en' ? 'No active subscription' : 'Aucun abonnement actif';
  const endedLabel = locale === 'en' ? 'Ended on' : 'Terminé le';

  // CTA checkout
  const defaultPriceLookupKey =
    locale === 'en' ? 'magic_monthly_usd' : 'magic_monthly_eur';

  const hidePlanDetails = isCancelScheduled || isCanceled;

  // ✅ Nouvelle info: validité si abonnement annulé
  const validityLabel =
    locale === 'en' ? 'Access valid until' : 'Accès valable jusqu’au';
  const validityEndedMain = locale === 'en' ? 'Access ended' : 'Accès terminé';

  // ✅ Date fin d’accès si clôture planifiée : utiliser cancel_at en premier (très fiable)
  const cancelAtSec = (() => {
    const v = (sub as any)?.cancel_at;
    return typeof v === 'number' ? v : null;
  })();

  const accessEndSec: number | null =
    cancelAtSec ?? currentPeriodEndSec ?? nextPaymentSec ?? null;

  const accessEndLabel =
    accessEndSec != null
      ? new Date(accessEndSec * 1000).toLocaleDateString(localeTag)
      : '';

  // ✅ Date de fin de validité: si canceled => endedAtSec en priorité
  const validUntilSec: number | null =
    (isCanceled ? endedAtSec ?? currentPeriodEndSec ?? nextPaymentSec : null) ??
    null;

  const validUntilLabel =
    validUntilSec != null
      ? new Date(validUntilSec * 1000).toLocaleDateString(localeTag)
      : '';

  // ---------- DEBUG SERVER (visible dans logs serveur)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[BILLING DEBUG]', {
      locale,
      isInDbTrialWindow,
      hasSub,
      subId,
      status,
      rawCancelScheduled,
      isCancelScheduled,
      isCanceled,
      currentPeriodStartSec,
      currentPeriodEndSec,
      cancelAtSec,
      nextPaymentSec,
      accessEndSec,
      endedAtSec,
      preview_next_payment_attempt:
        previewInvoice?.next_payment_attempt ?? null,
      preview_period_end: periodEndFromPreview,
      preview_line_sub_end: lineEndForSub,
      preview_line0_end: lineEndFirst,
    });
  }

  // -------- Bandeau du haut
  let showCountdown = false;
  let countdownLabel = '';
  let countdownUntilLabel = '';
  let countdownProgressPct = 0;
  let countdownMainText = '';

  if (isInDbTrialWindow) {
    // 1) Trial BDD
    showCountdown = true;
    countdownLabel = t('subscription.trialEndLabel');
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEndDb.getTime() - Date.now()) / DAY_MS)
    );
    countdownMainText = makeDaysLeftText(locale, daysLeft);
    countdownUntilLabel = trialEndDbLabel;
    countdownProgressPct = computeProgressPct(
      trialStartDb.getTime(),
      trialEndDb.getTime()
    );
  } else if (isCancelScheduled) {
    // 2) Clôture planifiée (fin d’accès)
    showCountdown = true;
    countdownLabel = locale === 'en' ? 'Access ends in' : 'Fin d’accès dans';

    const endMs = accessEndSec ? accessEndSec * 1000 : null;

    if (endMs && accessEndLabel) {
      const daysLeft = Math.max(0, Math.ceil((endMs - Date.now()) / DAY_MS));
      countdownMainText = makeDaysLeftText(locale, daysLeft);
      countdownUntilLabel = accessEndLabel;
      countdownProgressPct = computeProgressPct(stripePeriodStartMs, endMs);
    } else {
      // ✅ IMPORTANT : on affiche quand même le bandeau pour diagnostiquer
      countdownMainText =
        locale === 'en' ? 'End date unavailable' : 'Date de fin indisponible';
      countdownUntilLabel = '';
      countdownProgressPct = 0;
    }
  } else if (hasSub && isCanceled && validUntilSec && validUntilLabel) {
    // 3) Abonnement annulé -> validité
    const validUntilMs = validUntilSec * 1000;
    const msLeft = validUntilMs - Date.now();
    const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));

    showCountdown = true;
    countdownLabel = validityLabel;

    countdownMainText =
      validUntilMs > Date.now()
        ? makeDaysLeftText(locale, daysLeft)
        : validityEndedMain;

    countdownUntilLabel = validUntilLabel;
    countdownProgressPct = computeProgressPct(
      stripePeriodStartMs,
      validUntilMs
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[BILLING BANNER]', {
      showCountdown,
      countdownLabel,
      countdownUntilLabel,
      countdownMainText,
      countdownProgressPct,
    });
  }

  const countdownUntilText = makeUntilText(locale, countdownUntilLabel);

  const startedOn = (sub as any)?.start_date
    ? new Date((sub as any).start_date * 1000).toLocaleDateString(localeTag)
    : '';

  function renderStatusBadge(s: string) {
    if (isCanceled)
      return <span className={badgeMuted}>{t('status.closed')}</span>;

    if (isInDbTrialWindow)
      return <span className={badgeWarning}>{t('status.trialing')}</span>;

    if (isCancelScheduled)
      return <span className={badgeWarning}>{t('status.closurePlanned')}</span>;

    if (s === 'active')
      return <span className={badgePositive}>{t('status.active')}</span>;
    if (s === 'trialing')
      return <span className={badgeWarning}>{t('status.trialing')}</span>;
    if (s === 'past_due' || s === 'unpaid')
      return <span className={badgeWarning}>{t('status.paymentPending')}</span>;

    return <span className={badgeNeutral}>{s}</span>;
  }

  const showManageSubscription = hasSub;
  const showCancelResumeButtons = hasSub && !isInDbTrialWindow && !isCanceled;

  return (
    <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* En-tête */}
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-black">
            {t('header.title')}
          </h1>
          <p className="text-sm text-black/70">{t('header.subtitle')}</p>
        </header>

        {/* Bandeau haut */}
        {showCountdown ? (
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-primary to-[#d400ff]" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-black/60">
                    {countdownLabel}
                  </div>
                  <div className="text-lg font-semibold text-black leading-tight">
                    {countdownMainText}
                  </div>
                  {countdownUntilText ? (
                    <div className="text-xs text-black/50">
                      {countdownUntilText}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[#d400ff]"
                  style={{ width: `${countdownProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Bloc abonnement */}
        <section className={`${cardBase} ${cardPadding}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-black/50">
                {t('subscription.sectionLabel')}
              </div>

              {!hasSub ? (
                <div className="text-xl font-semibold text-black">
                  {inactiveTitle}
                </div>
              ) : hidePlanDetails ? (
                <div className="text-xl font-semibold text-black">
                  {isCancelScheduled
                    ? t('status.closurePlanned')
                    : inactiveTitle}
                </div>
              ) : (
                <div className="text-xl font-semibold text-black">
                  {planLabel} —{' '}
                  {formatCentsToCurrency(amount || 0, currency, localeTag)} /{' '}
                  {intervalLabel}
                </div>
              )}
            </div>

            <div className="md:text-right">{renderStatusBadge(status)}</div>
          </div>

          <div className="my-6 h-px w-full bg-black/10" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Infos */}
            <dl className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hasSub ? (
                <>
                  {startedOn ? (
                    <div className="space-y-1">
                      <dt className="text-sm text-black/60">
                        {t('subscription.subscriptionLabel')}
                      </dt>
                      <dd className="text-base font-medium text-black">
                        {startedOn}
                      </dd>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <dt className="text-sm text-black/60">
                      {nextPaymentLabel}
                    </dt>
                    <dd className="text-base font-medium text-black">
                      {nextPaymentValue}
                    </dd>
                  </div>

                  {isCanceled && validUntilLabel ? (
                    <div className="space-y-1">
                      <dt className="text-sm text-black/60">{validityLabel}</dt>
                      <dd className="text-base font-medium text-black">
                        {validUntilLabel}
                      </dd>
                    </div>
                  ) : null}

                  {isCanceled && endedOnLabel ? (
                    <div className="space-y-1">
                      <dt className="text-sm text-black/60">{endedLabel}</dt>
                      <dd className="text-base font-medium text-black">
                        {endedOnLabel}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>

            {/* Actions */}
            <div className="flex flex-col items-stretch gap-3 md:items-end">
              {!hasSub ? (
                <>
                  <form
                    action="/api/stripe/checkout"
                    method="POST"
                    className="w-full md:w-auto"
                  >
                    <input
                      type="hidden"
                      name="checkoutLocale"
                      value={locale === 'fr' ? 'fr' : 'en'}
                    />
                    <input
                      type="hidden"
                      name="priceLookupKey"
                      value={defaultPriceLookupKey}
                    />
                    <input type="hidden" name="mode" value="subscription" />
                    <input type="hidden" name="successUrl" value={successUrl} />
                    <input type="hidden" name="cancelUrl" value={cancelUrl} />
                    <button className={btnMagic}>
                      {locale === 'en' ? 'Subscribe' : 'S’abonner'}
                    </button>
                  </form>

                  <Link
                    href={`/${locale}/plans?from=billing`}
                    className={btnGhost}
                  >
                    {t('actions.comparePlans')}
                  </Link>
                </>
              ) : (
                <>
                  {showManageSubscription ? (
                    <form
                      action="/api/stripe/portal"
                      method="POST"
                      className="w-full md:w-auto"
                    >
                      <input
                        type="hidden"
                        name="returnUrl"
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices`}
                      />
                      <input
                        type="hidden"
                        name="portalLocale"
                        value={locale === 'fr' ? 'fr' : 'en'}
                      />
                      <button
                        type="submit"
                        className={btnPrimary}
                        aria-label={t('actions.manageSubscription')}
                      >
                        {t('actions.manageSubscription')}
                      </button>
                    </form>
                  ) : null}

                  {showCancelResumeButtons ? (
                    isCancelScheduled ? (
                      <form
                        action="/api/stripe/subscription/resume"
                        method="POST"
                        className="w-full md:w-auto"
                      >
                        <input
                          type="hidden"
                          name="subscriptionId"
                          value={subId}
                        />
                        <input
                          type="hidden"
                          name="returnUrl"
                          value={`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices`}
                        />
                        <button className={btnGhost}>
                          {t('actions.cancelClosure')}
                        </button>
                      </form>
                    ) : (
                      <form
                        action="/api/stripe/subscription/cancel"
                        method="POST"
                        className="w-full md:w-auto"
                      >
                        <input
                          type="hidden"
                          name="subscriptionId"
                          value={subId}
                        />
                        <input
                          type="hidden"
                          name="returnUrl"
                          value={`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices`}
                        />
                        <button className={btnDanger}>
                          {t('actions.scheduleClosure')}
                        </button>
                      </form>
                    )
                  ) : null}

                  {!isCancelScheduled && !isCanceled && !isCurrentMagic ? (
                    <div
                      className="mt-2 flex flex-wrap gap-2 md:justify-end"
                      role="group"
                    >
                      <form action="/api/stripe/checkout" method="POST">
                        <input
                          type="hidden"
                          name="checkoutLocale"
                          value={locale === 'fr' ? 'fr' : 'en'}
                        />
                        <input
                          type="hidden"
                          name="priceLookupKey"
                          value="magic_monthly_eur"
                        />
                        <input type="hidden" name="mode" value="subscription" />
                        <input
                          type="hidden"
                          name="successUrl"
                          value={successUrl}
                        />
                        <input
                          type="hidden"
                          name="cancelUrl"
                          value={cancelUrl}
                        />
                        <button
                          className={btnMagic}
                          aria-label={t('actions.upgradeMagic')}
                        >
                          {t('actions.upgradeMagic')}
                        </button>
                      </form>

                      <Link
                        href={`/${locale}/plans?from=billing`}
                        className={btnGhost}
                      >
                        {t('actions.comparePlans')}
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Bloc factures */}
        <section className={`${cardBase} ${cardPadding}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">
              {t('invoices.title')}
            </h2>
            <div className="text-xs text-black/60">
              {t('invoices.subtitle')}
            </div>
          </div>

          {invoices.data.length === 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-black/70">{t('invoices.empty')}</div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead className="text-black/60">
                  <tr className="border-y border-black/10">
                    <th className="px-2 py-2 text-left font-medium">
                      {t('invoices.columns.date')}
                    </th>
                    <th className="px-2 py-2 text-left font-medium">
                      {t('invoices.columns.reference')}
                    </th>
                    <th className="px-2 py-2 text-left font-medium">
                      {t('invoices.columns.status')}
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      {t('invoices.columns.amount')}
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      {t('invoices.columns.action')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {invoices.data.map((inv) => (
                    <tr key={inv.id} className="align-middle">
                      <td className="px-2 py-2 whitespace-nowrap">
                        {new Date((inv.created || 0) * 1000).toLocaleDateString(
                          localeTag
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className="font-medium text-black break-all">
                          {inv.number || inv.id}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className={badgeMuted + ' capitalize'}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="font-medium text-black">
                          {formatCentsToCurrency(
                            inv.total || 0,
                            inv.currency?.toUpperCase() || 'EUR',
                            localeTag
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        {inv.invoice_pdf ? (
                          <Link
                            href={inv.invoice_pdf}
                            target="_blank"
                            className={btnPrimary}
                          >
                            {t('invoices.actions.downloadPdf')}
                          </Link>
                        ) : inv.hosted_invoice_url ? (
                          <Link
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            className={btnPrimary}
                          >
                            {t('invoices.actions.viewOnline')}
                          </Link>
                        ) : (
                          <span className="text-black/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="text-xs text-black/60">
          {t('help.text')}{' '}
          <Link
            href={`/${locale}${t('help.contactLink')}`}
            className="underline underline-offset-4 hover:no-underline"
          >
            {t('help.contactLink')}
          </Link>
          .
        </section>
      </div>
    </main>
  );
}
