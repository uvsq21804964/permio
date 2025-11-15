// app/[locale]/(routes)/(routes)/billing/page.tsx
export const runtime = 'nodejs'; // Stripe SDK = Node (pas d’Edge)

import { stripe } from '@/lib/stripe';
import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

type SubWithPeriods = Stripe.Subscription & {
  start_date?: number;
  current_period_end?: number;
};

function mapPlanName(raw?: string | null) {
  if (!raw) return '—';
  const k = String(raw).toLowerCase();
  if (k.startsWith('starter')) return 'Starter';
  if (k.startsWith('pro')) return 'Pro';
  if (k.startsWith('magic')) return 'Full Magic';
  return raw;
}

function formatCentsToCurrency(cents: number, currency = 'eur') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(
    cents / 100
  );
}
function getPrimaryEmail(user: any): string | undefined {
  const id = user?.primaryEmailAddressId;
  return user?.emailAddresses?.find((e: any) => e.id === id)?.emailAddress;
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
  params: { locale: string };
}) {
  // --- Auth
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Next.js 15: searchParams est async dyn
  const sp = (await searchParams) || {};
  const sessionId = Array.isArray(sp.session_id)
    ? sp.session_id[0]
    : sp.session_id;

  // --- Clerk user (évite currentUser() qui te jette)
  const clerk = await getClerkClient();
  let user: any;
  try {
    user = await clerk.users.getUser(userId);
  } catch (e) {
    // Si Clerk tombe, on redirige proprement
    redirect('/sign-in');
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
      // silencieux, on retombe sur la recherche email
    }
  }

  // 2) Fallback: recherche par email Stripe (utile après Billing Portal)
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

  // --- État sans client Stripe → proposition d’abonnement
  if (!customerId) {
    return (
      <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="break-words" style={{ hyphens: 'auto' }}>
            <h1 className="text-2xl md:text-3xl font-semibold text-black">
              Facturation
            </h1>
            <p className="mt-2 text-sm text-black/70">
              Aucune formule n’est active pour le moment. Choisissez un plan
              pour démarrer.
            </p>
          </header>

          <section className={`${cardBase} ${cardPadding}`}>
            <div
              className="flex flex-wrap items-center gap-3"
              role="group"
              aria-label="Choisir une formule"
            >
              <form action="/api/stripe/checkout" method="POST">
                <input
                  type="hidden"
                  name="priceLookupKey"
                  value="starter_monthly_eur"
                />
                <input type="hidden" name="mode" value="subscription" />
                <input
                  type="hidden"
                  name="successUrl"
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`}
                />
                <input
                  type="hidden"
                  name="cancelUrl"
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`}
                />
                <button className={btnPrimary}>Choisir Starter</button>
              </form>

              <form action="/api/stripe/checkout" method="POST">
                <input
                  type="hidden"
                  name="priceLookupKey"
                  value="pro_monthly_eur"
                />
                <input type="hidden" name="mode" value="subscription" />
                <input
                  type="hidden"
                  name="successUrl"
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`}
                />
                <input
                  type="hidden"
                  name="cancelUrl"
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`}
                />
                <button className={btnGhost}>Choisir Pro</button>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // -------- Abonnement et factures (active -> trialing -> all)
  let sub: SubWithPeriods | undefined;
  try {
    const resActive = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
      expand: ['data.items.data.price'],
    });
    sub = resActive.data[0] as SubWithPeriods | undefined;

    if (!sub) {
      const resTrial = await stripe.subscriptions.list({
        customer: customerId,
        status: 'trialing',
        limit: 1,
        expand: ['data.items.data.price'],
      });
      sub = resTrial.data[0] as SubWithPeriods | undefined;
    }
    if (!sub) {
      const resAny = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1,
        expand: ['data.items.data.price'],
      });
      sub = resAny.data[0] as SubWithPeriods | undefined;
    }
  } catch {
    // garde sub = undefined
  }

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });

  // Détails plan/prix
  let planLabel = '—';
  let amount = 0;
  let currency = 'EUR';
  let interval: 'day' | 'week' | 'month' | 'year' | 'unknown' = 'month';
  if (sub?.items.data[0]?.price) {
    const price = sub.items.data[0].price as Stripe.Price;
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

  // Clé du plan actuel (pour cacher l’option identique)
  const currentPlanRaw =
    (sub?.items.data[0]?.price as Stripe.Price | undefined)?.lookup_key ??
    (sub?.items.data[0]?.price as Stripe.Price | undefined)?.nickname ??
    '';
  const currentPlan = String(currentPlanRaw).toLowerCase();
  const isCurrent = (prefix: string) => currentPlan.startsWith(prefix);

  // Métadonnées + dates robustes
  // ---- États & dates (remplace ton bloc actuel)
  // ---- États & dates (HIDE date if canceled OR cancel_at_period_end)
  const subId = sub?.id;
  const status = sub?.status ?? 'inconnu';

  const firstItem = sub?.items?.data?.[0] as any | undefined;

  const isCancelScheduled = Boolean((sub as any)?.cancel_at_period_end);
  const isCanceled = status === 'canceled' || Boolean((sub as any)?.ended_at);

  // seconds potentially available (selon ta version API)
  const currentPeriodEndSec =
    (sub as any)?.current_period_end ??
    firstItem?.current_period_end ??
    undefined;
  const cancelAtSec = (sub as any)?.cancel_at ?? undefined;
  const trialEndSec = (sub as any)?.trial_end ?? undefined;

  // 1) règle d’affichage : si annulé (définitif) OU clôture planifiée → on masque le bloc date
  const hideRenewalCompletely = isCanceled || isCancelScheduled;

  // 2) sinon on choisit un libellé/date “normale”
  let renewalLabel: 'Renouvellement' | 'Fin d’essai' | '—' = '—';
  let renewalDate: string = '—';

  if (!hideRenewalCompletely) {
    if (status === 'trialing') {
      renewalLabel = 'Fin d’essai';
      const sec = trialEndSec ?? currentPeriodEndSec;
      renewalDate = sec
        ? new Date(sec * 1000).toLocaleDateString('fr-FR')
        : '—';
    } else if (status === 'active') {
      renewalLabel = 'Renouvellement';
      const sec = currentPeriodEndSec;
      renewalDate = sec
        ? new Date(sec * 1000).toLocaleDateString('fr-FR')
        : '—';
    }
  }

  // Date de souscription (inchangé)
  const startedOn = (sub as any)?.start_date
    ? new Date((sub as any).start_date * 1000).toLocaleDateString('fr-FR')
    : '—';

  const endSec =
    (sub as any)?.current_period_end ??
    firstItem?.current_period_end ??
    (sub as any)?.trial_end ??
    (isCancelScheduled ? (sub as any)?.cancel_at : undefined);

  const endDate = endSec
    ? new Date(endSec * 1000).toLocaleDateString('fr-FR')
    : '—';

  // URLs locales
  const locale = params?.locale ?? 'fr';
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing?canceled=1`;

  function renderStatusBadge(s: string) {
    if (isCanceled) return <span className={badgeMuted}>Clôturé</span>;
    if (isCancelScheduled)
      return <span className={badgeWarning}>Clôture planifiée</span>;
    if (s === 'active') return <span className={badgePositive}>Actif</span>;
    if (s === 'trialing')
      return <span className={badgeWarning}>Période d’essai</span>;
    if (s === 'past_due' || s === 'unpaid')
      return <span className={badgeWarning}>Paiement en attente</span>;
    return <span className={badgeNeutral}>{s}</span>;
  }

  return (
    <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* En-tête */}
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-black">
            Facturation
          </h1>
          <p className="text-sm text-black/70">
            Gérez votre abonnement, vos factures et vos moyens de paiement.
          </p>
        </header>

        {/* Souscription */}
        <div className="space-y-1">
          <dt className="text-sm text-black/60">Souscription</dt>
          <dd className="text-base font-medium text-black">{startedOn}</dd>
        </div>
        {isCancelScheduled && (
          <p className="mt-2 text-xs text-black/60">
            Clôture planifiée. L’abonnement ne sera pas reconduit.
          </p>
        )}
        {isCanceled && (
          <p className="mt-2 text-xs text-black/60">Abonnement clôturé.</p>
        )}

        {/* Renouvellement / Fin d’essai — masqué si cancel planifiée ou déjà annulé */}
        {!hideRenewalCompletely && (
          <div className="space-y-1">
            <dt className="text-sm text-black/60">{renewalLabel}</dt>
            <dd className="text-base font-medium text-black">{renewalDate}</dd>
          </div>
        )}

        {/* Bloc abonnement */}
        <section className={`${cardBase} ${cardPadding}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-black/50">
                Abonnement
              </div>
              <div className="text-xl font-semibold text-black">
                {planLabel} — {formatCentsToCurrency(amount || 0, currency)} /{' '}
                {interval === 'year' ? 'an' : 'mois'}
              </div>
            </div>
            <div className="md:text-right">{renderStatusBadge(status)}</div>
          </div>

          <div className="my-6 h-px w-full bg-black/10" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Infos */}
            <dl className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm text-black/60">Souscription</dt>
                <dd className="text-base font-medium text-black">
                  {startedOn}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-black/60">{renewalLabel}</dt>
                <dd className="text-base font-medium text-black">
                  {renewalDate}
                </dd>
              </div>

              {subId ? (
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-sm text-black/60">ID abonnement</dt>
                  <dd className="text-xs text-black/60 break-all font-mono">
                    {subId}
                  </dd>
                </div>
              ) : null}
            </dl>

            {/* Actions */}
            <div className="flex flex-col items-stretch gap-3 md:items-end">
              {/* Portail de facturation */}
              <form
                action="/api/stripe/portal"
                method="POST"
                className="w-full md:w-auto"
              >
                <input
                  type="hidden"
                  name="returnUrl"
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing`}
                />
                <button
                  type="submit"
                  className={btnPrimary}
                  aria-label="Gérer l'abonnement"
                >
                  Gérer l'abonnement
                </button>
              </form>

              {/* Annuler / Résumer la clôture */}
              {subId && isCancelScheduled ? (
                <form
                  action="/api/stripe/subscription/resume"
                  method="POST"
                  className="w-full md:w-auto"
                >
                  <input type="hidden" name="subscriptionId" value={subId} />
                  <input
                    type="hidden"
                    name="returnUrl"
                    value={`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing`}
                  />
                  <button className={btnGhost}>Annuler la clôture</button>
                </form>
              ) : subId ? (
                <form
                  action="/api/stripe/subscription/cancel"
                  method="POST"
                  className="w-full md:w-auto"
                >
                  <input type="hidden" name="subscriptionId" value={subId} />
                  <input
                    type="hidden"
                    name="returnUrl"
                    value={`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing`}
                  />
                  <button className={btnDanger}>
                    Clore l’abonnement (fin de période)
                  </button>
                </form>
              ) : null}

              {/* Upsell (on cache le plan en cours) */}
              {!isCancelScheduled && (
                <div
                  className="mt-2 flex flex-wrap gap-2 md:justify-end"
                  role="group"
                  aria-label="Changer de plan"
                >
                  {!isCurrent('starter') && (
                    <form action="/api/stripe/checkout" method="POST">
                      <input
                        type="hidden"
                        name="priceLookupKey"
                        value="starter_monthly_eur"
                      />
                      <input type="hidden" name="mode" value="subscription" />
                      <input
                        type="hidden"
                        name="successUrl"
                        value={successUrl}
                      />
                      <input type="hidden" name="cancelUrl" value={cancelUrl} />
                      <button className={btnGhost}>Passer à Starter</button>
                    </form>
                  )}
                  {!isCurrent('pro') && (
                    <form action="/api/stripe/checkout" method="POST">
                      <input
                        type="hidden"
                        name="priceLookupKey"
                        value="pro_monthly_eur"
                      />
                      <input type="hidden" name="mode" value="subscription" />
                      <input
                        type="hidden"
                        name="successUrl"
                        value={successUrl}
                      />
                      <input type="hidden" name="cancelUrl" value={cancelUrl} />
                      <button className={btnGhost}>Passer à Pro</button>
                    </form>
                  )}
                  {!isCurrent('magic') && (
                    <form action="/api/stripe/checkout" method="POST">
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
                      <input type="hidden" name="cancelUrl" value={cancelUrl} />
                      <button
                        className={btnMagic}
                        aria-label="Passer au plan Full Magic"
                      >
                        Passer à Full Magic
                      </button>
                      {/* le bouton “Comparer” ne doit pas soumettre le form */}
                      <Link
                        href={`/${locale}/plans?from=billing`}
                        className={btnGhost}
                      >
                        Comparer les formules
                      </Link>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bloc factures */}
        <section className={`${cardBase} ${cardPadding}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Factures</h2>
            <div className="text-xs text-black/60">Dernières 10 factures</div>
          </div>

          {invoices.data.length === 0 ? (
            <div className="text-sm text-black/70">
              Aucune facture pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table className="min-w-full table-fixed border-collapse text-sm">
                <thead className="text-black/60">
                  <tr className="border-y border-black/10">
                    <th className="px-2 py-2 text-left font-medium">Date</th>
                    <th className="px-2 py-2 text-left font-medium">
                      Référence
                    </th>
                    <th className="px-2 py-2 text-left font-medium">Statut</th>
                    <th className="px-2 py-2 text-right font-medium">
                      Montant
                    </th>
                    <th className="px-2 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {invoices.data.map((inv) => (
                    <tr key={inv.id} className="align-middle">
                      <td className="px-2 py-2 whitespace-nowrap">
                        {new Date((inv.created || 0) * 1000).toLocaleDateString(
                          'fr-FR'
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
                            inv.currency?.toUpperCase()
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
                            Télécharger PDF
                          </Link>
                        ) : inv.hosted_invoice_url ? (
                          <Link
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            className={btnPrimary}
                          >
                            Voir en ligne
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
          Besoin d’aide ? Rendez-vous sur{' '}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:no-underline"
          >
            /contact
          </Link>
          .
        </section>
      </div>
    </main>
  );
}
