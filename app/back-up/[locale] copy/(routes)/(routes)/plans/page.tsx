'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';

type Currency = 'EUR' | 'USD';
const CURRENCY_META: Record<Currency, { symbol: string; label: string }> = {
  EUR: { symbol: '€', label: 'EUR €' },
  USD: { symbol: '$', label: 'USD $' },
};

type Plan = {
  id: string;
  title: string;
  prices: Record<Currency, number>;
  lookupKeys?: Record<Currency, string>; // ← au lieu de lookupKey?: string
  features: string[];
  highlighted?: boolean;
  cta?: string;
  hoursSavedAvg: number;
  maxStudents?: number | null;
};

const PLANS: Plan[] = [
  {
    id: 'free',
    title: 'Gratuit',
    prices: { EUR: 0, USD: 0 },
    features: [
      "Jusqu'à 2 étudiants",
      'Optimisation de base',
      'Support par email',
    ],
    cta: 'Obtenir mon code',
    hoursSavedAvg: 0.1,
    maxStudents: 2,
  },
  {
    id: 'starter',
    title: 'Starter',
    prices: { EUR: 8, USD: 9 },
    lookupKeys: { EUR: 'starter_monthly_eur', USD: 'starter_monthly_usd' },
    features: [
      "Jusqu'à 4 étudiants",
      'Optimisation de base',
      'Support prioritaire (email et téléphone)',
    ],
    hoursSavedAvg: 0.3,
    maxStudents: 4,
  },
  {
    id: 'pro',
    title: 'Pro',
    prices: { EUR: 17, USD: 19 },
    lookupKeys: { EUR: 'pro_monthly_eur', USD: 'pro_monthly_usd' },
    features: [
      "Jusqu'à 8 étudiants",
      'Optimisation avancée',
      'Support prioritaire (email et téléphone)',
    ],
    highlighted: true,
    hoursSavedAvg: 0.45,
    maxStudents: 8,
  },
  {
    id: 'magic',
    title: 'Full Magic',
    prices: { EUR: 32, USD: 38 },
    lookupKeys: { EUR: 'magic_monthly_eur', USD: 'magic_monthly_usd' },
    features: [
      'Étudiants illimités',
      'Optimisation avancée',
      'Support prioritaire (email et téléphone)',
      'Logo personnel',
      'Features sur-mesure sans supplément !',
    ],
    hoursSavedAvg: 0.7,
    maxStudents: null,
  },
];

function formatSignedCurrency(amount: number, currency: Currency) {
  if (!Number.isFinite(amount)) amount = 0;
  if (amount > 0) return `+${formatCurrency(amount, currency)}`;
  if (amount < 0) return `-${formatCurrency(Math.abs(amount), currency)}`;
  return formatCurrency(0, currency);
}

// Courbe lissée : nombre d'élèves -> heures gagnées / sem / élève
// Points de contrôle (modifiable à ta guise) :
// 2 élèves → 0.10 h ; 4 → 0.30 h ; 8 → 0.45 h ; 20 → 0.70 h
const HOURS_SAVED_POINTS: Array<[number, number]> = [
  [0, 0.1],
  [2, 0.1],
  [4, 0.3],
  [8, 0.45],
  [20, 0.7],
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolation linéaire par morceaux, clampée aux bornes */
function getHoursSavedAvgSmooth(effectiveStudents: number): number {
  const x = Math.max(0, effectiveStudents);

  // Si en-dessous du premier point
  if (x <= HOURS_SAVED_POINTS[0][0]) return HOURS_SAVED_POINTS[0][1];

  for (let i = 0; i < HOURS_SAVED_POINTS.length - 1; i++) {
    const [x0, y0] = HOURS_SAVED_POINTS[i];
    const [x1, y1] = HOURS_SAVED_POINTS[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / Math.max(1e-6, x1 - x0);
      return Number(lerp(y0, y1, t).toFixed(2)); // garde 2 décimales
    }
  }

  // Au-delà du dernier point → valeur du dernier point
  return HOURS_SAVED_POINTS[HOURS_SAVED_POINTS.length - 1][1];
}

function formatCurrency(amount: number, currency: Currency) {
  const locale = currency === 'USD' ? 'en-US' : undefined; // ← évite $US en fr-FR
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol', // ← force "$" au lieu de "$US"
    maximumFractionDigits: 0,
  }).format(amount);
}
export default function SubscribePage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingTrialId, setLoadingTrialId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Devise choisie
  const [currency, setCurrency] = useState<Currency>('EUR');

  // Entrées utilisateur (exprimées dans la devise sélectionnée)
  const [hourlyRate, setHourlyRate] = useState<number>(30);
  const [avgLessonsPerStudent, setAvgLessonsPerStudent] = useState<number>(2);
  const [studentsCount, setStudentsCount] = useState<number>(4);

  const validHourlyRate = useMemo(
    () => (Number.isFinite(hourlyRate) && hourlyRate > 0 ? hourlyRate : 0),
    [hourlyRate]
  );
  const validLessons = useMemo(
    () =>
      Number.isFinite(avgLessonsPerStudent) && avgLessonsPerStudent > 0
        ? avgLessonsPerStudent
        : 0,
    [avgLessonsPerStudent]
  );
  const validStudents = useMemo(
    () =>
      Number.isFinite(studentsCount) && studentsCount >= 0
        ? Math.floor(studentsCount)
        : 0,
    [studentsCount]
  );

  // → calcul du plan le plus avantageux selon le net
  const bestPlanId = useMemo(() => {
    let bestId: string | null = null;
    let bestNet = -Infinity;

    for (const plan of PLANS) {
      const price = plan.prices[currency];
      const cap = plan.maxStudents ?? validStudents;
      const effectiveStudents = Math.min(validStudents, cap);
      const hoursSavedAvg = getHoursSavedAvgSmooth(effectiveStudents);

      const hoursPerWeekAll = hoursSavedAvg * validLessons * effectiveStudents;
      const gross = Math.round(hoursPerWeekAll * 4.33 * validHourlyRate);
      const net = gross - price;

      if (net > bestNet) {
        bestNet = net;
        bestId = plan.id;
      }
    }
    return bestId;
  }, [currency, validStudents, validLessons, validHourlyRate]);

  const subscribe = async (plan: Plan) => {
    try {
      setError(null);
      setLoadingId(plan.id);

      const lookupKey = plan.lookupKeys?.[currency];
      if (!lookupKey) {
        // offre gratuite
        const r = await fetch('/api/plan/free', { method: 'POST' });
        if (!r.ok)
          throw new Error(
            `HTTP ${r.status} – ${(await r.text()) || 'No body'}`
          );
        window.location.href = '/app';
        return;
      }

      const r = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookupKey }), // ← uniquement la lookupKey choisie
        cache: 'no-store',
      });
      if (!r.ok)
        throw new Error(`HTTP ${r.status} – ${(await r.text()) || 'No body'}`);
      const data = await r.json();
      if (!data?.url) throw new Error('Missing `url` in response');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
      setLoadingId(null);
    }
  };

  const startTrial = async (plan: Plan) => {
    try {
      const lookupKey = plan.lookupKeys?.[currency];
      if (!lookupKey) return; // pas d’essai pour le gratuit
      setError(null);
      setLoadingTrialId(plan.id);

      const r = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookupKey, trialDays: 30 }), // ← pas de currency
        cache: 'no-store',
      });
      if (!r.ok)
        throw new Error(`HTTP ${r.status} – ${(await r.text()) || 'No body'}`);
      const data = await r.json();
      if (!data?.url) throw new Error('Missing `url` in response');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
      setLoadingTrialId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Simulez vos gains mensuels,</h1>
        <h1 className="text-3xl font-bold">choisissez votre formule</h1>
        <p className="mt-2 text-sm text-gray-600">
          Des offres simples et transparentes. Annulable à tout moment.
        </p>

        {/* Essai */}
        <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <span className="font-semibold">Nouveau&nbsp;:</span> Essayez
          n'importe quelle offre payante pendant <strong>1 mois</strong> avant
          de souscrire — sans engagement.
        </div>

        {/* Sélecteur devise */}
        <div className="mx-auto mt-4 flex max-w-2xl items-center justify-center gap-3">
          <span className="text-sm text-gray-700">Devise</span>
          <div className="flex rounded-xl border border-gray-300 p-1">
            {(['EUR', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={clsx(
                  'px-3 py-1 text-sm rounded-lg transition',
                  currency === c
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-gray-100'
                )}
              >
                {CURRENCY_META[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* Contrôles d’estimation */}
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-3">
            <label htmlFor="hourly" className="text-sm text-gray-700">
              Tarif horaire moyen ({CURRENCY_META[currency].symbol}/h)
            </label>
            <input
              id="hourly"
              type="number"
              min={0}
              step={1}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value))}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <label htmlFor="lessons" className="text-sm text-gray-700">
              Cours moyens / élève / semaine
            </label>
            <input
              id="lessons"
              type="number"
              min={0}
              step={0.5}
              value={avgLessonsPerStudent}
              onChange={(e) =>
                setAvgLessonsPerStudent(parseFloat(e.target.value))
              }
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <label htmlFor="students" className="text-sm text-gray-700">
              Nombre d’élèves
            </label>
            <input
              id="students"
              type="number"
              min={0}
              step={1}
              value={studentsCount}
              onChange={(e) => setStudentsCount(parseFloat(e.target.value))}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Le gain estimé = h gagnées/sem/élève × cours/élève × élèves (borné au
          max du plan) × 4,33 × tarif horaire.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-4">
        {PLANS.map((plan) => {
          const price = plan.prices[currency];
          const cap = plan.maxStudents ?? validStudents;
          const effectiveStudents = Math.min(validStudents, cap);

          // ✅ moyenne dynamique lissée
          const hoursSavedAvg = getHoursSavedAvgSmooth(effectiveStudents);

          const hoursPerWeekAll =
            hoursSavedAvg * validLessons * effectiveStudents;
          const gross = Math.round(hoursPerWeekAll * 4.33 * validHourlyRate);
          const net = gross - price;
          const isBest = plan.id === bestPlanId;

          const isPaid = Boolean(plan.lookupKeys?.[currency]);

          return (
            <article
              key={plan.id}
              className={clsx(
                'relative flex flex-col rounded-2xl border p-6 shadow-sm',
                isBest
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              {isBest && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                  Le + avantageux
                </span>
              )}

              <h2 className="text-xl font-semibold">{plan.title}</h2>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold">
                  {formatCurrency(price, currency)}
                </span>
                <span className="text-sm text-gray-500">/mois</span>
              </div>

              <p className="mt-2 text-sm">
                <span className="font-medium text-emerald-700">
                  Gain estimé :{' '}
                  {formatSignedCurrency(isFinite(gross) ? gross : 0, currency)}
                  /mois
                </span>{' '}
                <span className="text-gray-600">
                  (net&nbsp;:&nbsp;
                  {formatSignedCurrency(isFinite(net) ? net : 0, currency)}
                  /mois)
                </span>
              </p>

              <ul className="mt-4 text-xs text-gray-500 list-disc pl-5">
                <li>{effectiveStudents} élèves pris en compte</li>
                <li>
                  ~{hoursSavedAvg.toFixed(2)} h gagnées / semaine / élève
                  (moyenne lissée selon le nombre d’élèves pris en compte)
                </li>
              </ul>

              <ul className="mt-6 space-y-2 text-sm text-gray-700">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(plan)}
                disabled={loadingId === plan.id}
                className={clsx(
                  'mt-8 w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition',
                  isBest
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : isPaid
                    ? 'bg-slate-900 text-white hover:bg-black'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700',
                  loadingId === plan.id && 'opacity-70'
                )}
              >
                {loadingId === plan.id
                  ? 'Redirection…'
                  : plan.cta ?? 'Souscrire'}
              </button>

              {isPaid && (
                <button
                  onClick={() => startTrial(plan)}
                  disabled={loadingTrialId === plan.id}
                  className={clsx(
                    'mt-3 w-full rounded-xl border px-4 py-2 text-center text-xs font-medium transition',
                    'border-blue-200 text-blue-700 hover:bg-blue-50',
                    loadingTrialId === plan.id && 'opacity-70'
                  )}
                >
                  {loadingTrialId === plan.id
                    ? 'Préparation de l’essai…'
                    : 'Essayez pendant un mois avant de souscrire'}
                </button>
              )}

              {!isPaid && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Accès gratuit. Carte non requise.
                </p>
              )}
            </article>
          );
        })}
      </section>

      <footer className="mx-auto mt-10 max-w-2xl text-center text-xs text-gray-500">
        Les paiements sont traités en toute sécurité par Stripe. En souscrivant,
        vous acceptez nos CGV et notre politique de confidentialité.{' '}
        <Link href="/legal" className="underline">
          En savoir plus
        </Link>
      </footer>
    </main>
  );
}
