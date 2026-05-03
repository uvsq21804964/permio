'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const poppins = { className: 'font-sans' };

type Currency = 'EUR' | 'USD';
const CURRENCY_META: Record<Currency, { symbol: string; label: string }> = {
  EUR: { symbol: '€', label: 'EUR €' },
  USD: { symbol: '$', label: 'USD $' },
};

type Plan = {
  id: string;
  title: string;
  prices: Record<Currency, number>;
  lookupKeys?: Record<Currency, string>;
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
    prices: {
      EUR: Number(process.env.NEXT_PUBLIC_PRICE_EUR),
      USD: Number(process.env.NEXT_PUBLIC_PRICE_DOL),
    },
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const HOURS_SAVED_POINTS: Array<[number, number]> = [
  [0, 0.1],
  [2, 0.1],
  [4, 0.3],
  [8, 0.45],
  [20, 0.7],
];

function getHoursSavedAvgSmooth(effectiveStudents: number): number {
  const x = Math.max(0, effectiveStudents);
  if (x <= HOURS_SAVED_POINTS[0][0]) return HOURS_SAVED_POINTS[0][1];
  for (let i = 0; i < HOURS_SAVED_POINTS.length - 1; i++) {
    const [x0, y0] = HOURS_SAVED_POINTS[i];
    const [x1, y1] = HOURS_SAVED_POINTS[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / Math.max(1e-6, x1 - x0);
      return Number(lerp(y0, y1, t).toFixed(2));
    }
  }
  return HOURS_SAVED_POINTS[HOURS_SAVED_POINTS.length - 1][1];
}

function formatCurrency(amount: number, currency: Currency) {
  const locale = currency === 'USD' ? 'en-US' : undefined;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SubscribePage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('EUR');

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12 bg-[#f9ffc6]">
      {/* Header */}
      <header className="text-center">
        <h1
          className={`${poppins.className} font-display text-[clamp(26px,4.5vw,40px)] leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]`}
        >
          Simulez vos gains mensuels & choisissez votre formule
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Offres claires, sans engagement. Essai gratuit 30 jours sur les
          formules payantes.
        </p>

        {/* Bandeau essai */}
        <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-[#d400ff]/30 bg-white/70 backdrop-blur p-4 text-sm text-black/80">
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]">
            Nouveau ·{' '}
          </span>
          Essayez n’importe quelle offre payante pendant <strong>1 mois</strong>{' '}
          avant de souscrire.
        </div>

        {/* Sélecteur devise (pill gradient) */}
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2">
          <div className="inline-flex rounded-full p-1 bg-white/80 border border-black/10">
            {(['EUR', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-full transition',
                  currency === c
                    ? 'text-white bg-gradient-to-r from-primary to-[#d400ff] shadow'
                    : 'text-black/70 hover:bg-black/5'
                )}
              >
                {CURRENCY_META[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* Contrôles d’estimation (carte blanche compacte) */}
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-black/10 bg-white/80 backdrop-blur px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              id="hourly"
              label={`Tarif horaire moyen (${CURRENCY_META[currency].symbol}/h)`}
              value={String(validHourlyRate)}
              onChange={(v) => setHourlyRate(parseFloat(v))}
              step={1}
              min={0}
            />
            <Field
              id="lessons"
              label="Cours moyens / élève / semaine"
              value={String(validLessons)}
              onChange={(v) => setAvgLessonsPerStudent(parseFloat(v))}
              step={0.5}
              min={0}
            />
            <Field
              id="students"
              label="Nombre d’élèves"
              value={String(validStudents)}
              onChange={(v) => setStudentsCount(parseFloat(v))}
              step={1}
              min={0}
            />
          </div>
          <p className="mt-2 text-xs text-black/50">
            Gain estimé = h gagnées/sem/élève × cours/élève × élèves (borné au
            plan) × 4,33 × tarif horaire.
          </p>
        </div>
      </header>

      {error && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cartes plans */}
      <section className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-4 items-stretch">
        {PLANS.map((plan) => {
          const price = plan.prices[currency];
          const cap = plan.maxStudents ?? validStudents;
          const effectiveStudents = Math.min(validStudents, cap);
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
                'relative h-full flex flex-col rounded-2xl border p-5 sm:p-6 bg-white/85 backdrop-blur shadow-sm',
                isBest ? 'border-[#d400ff]/50' : 'border-black/10'
              )}
            >
              {isBest && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-[#d400ff] px-3 py-1 text-xs font-semibold text-white shadow">
                  Le + avantageux
                </span>
              )}

              {/* 👉 tout le contenu haut est dans ce wrapper */}
              <div className="flex-1 flex flex-col">
                <h2 className="font-display text-xl">{plan.title}</h2>

                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]">
                    {formatCurrency(price, currency)}
                  </span>
                  <span className="text-sm text-black/60">/mois</span>
                </div>

                <ul className="mt-3 text-xs text-black/60 list-disc pl-4 space-y-1">
                  <li>{effectiveStudents} élèves pris en compte</li>
                  <li>~{hoursSavedAvg.toFixed(2)} h gagnées / sem / élève</li>
                  <li>
                    Net estimé :{' '}
                    <span
                      className={
                        net >= 0
                          ? 'text-emerald-700 font-medium'
                          : 'text-red-700 font-medium'
                      }
                    >
                      {formatCurrency(net, currency)}/mois
                    </span>
                  </li>
                </ul>

                <ul className="mt-5 space-y-2 text-sm text-black/80">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gradient-to-r from-primary to-[#d400ff]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 👉 le bouton est SEUL, poussé en bas par mt-auto */}
              <button
                onClick={() => redirect('sign-up')}
                disabled={loadingId === plan.id}
                className={clsx(
                  'w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition mt-6',
                  'text-white bg-gradient-to-r from-primary to-[#d400ff] hover:opacity-95 shadow',
                  loadingId === plan.id && 'opacity-70'
                )}
              >
                {loadingId === plan.id ? 'Préparation…' : 'Essayer, sans carte'}
              </button>
            </article>
          );
        })}
      </section>

      <footer className="mx-auto mt-10 max-w-2xl text-center text-xs text-black/60">
        Paiements sécurisés par Stripe. En souscrivant, vous acceptez nos CGV et
        notre politique de confidentialité.{' '}
        <Link href="/legal" className="underline">
          En savoir plus
        </Link>
      </footer>
    </main>
  );
}

/* ---------- Petits composants ---------- */

function Field({
  id,
  label,
  value,
  onChange,
  step,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label htmlFor={id} className="grid gap-1">
      <span className="text-[13px] text-black/70">{label}</span>
      <input
        id={id}
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d400ff]/40"
      />
    </label>
  );
}
