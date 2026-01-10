// app/pricing/plan-comparison.tsx
'use client';

import { cn } from '@/lib/utils'; // optionnel
import { ArrowRight, Check, X } from 'lucide-react';
import { Sparkles } from 'lucide-react';

import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type Plan = {
  id: 'free' | 'starter' | 'pro' | 'magic';
  title: string;
  prices: { EUR: number; USD: number };
  lookupKeys?: { EUR: string; USD: string };
  features: string[];
  highlighted?: boolean;
  hoursSavedAvg: number;
  maxStudents: number | null;
};

// Helpers d'affichage
type CellValue = boolean | 'extra' | number | string | null | undefined;

function formatValueByLabel(label: string, v: CellValue): string {
  if (v === null || v === undefined) return '—';

  // Heures gagnées → "0.45 h"
  if (/Heures gagnées/i.test(label) && typeof v === 'number') {
    return `${v.toFixed(2)} h`;
  }

  // Étudiants max → gère "Illimité" / Infinity / number
  if (/Étudiants max/i.test(label)) {
    if (v === 'Illimité' || v === 'illimité') return 'Illimité';
    if (v === Infinity) return 'Illimité';
    if (typeof v === 'number') return String(v);
  }

  // Niveau d'optimisation → texte ("Basique" / "Supérieur")
  if (/Niveau d'optimisation/i.test(label) && typeof v === 'string') {
    return v;
  }

  if (typeof v === 'number') return String(v);
  if (typeof v === 'string' && v.trim() !== '') return v;
  return '—';
}

function isTruthyValue(v: CellValue): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return true;
  if (typeof v === 'string') return v.trim() !== '' && v !== '—' && v !== '-';
  return false;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    title: 'Gratuit',
    prices: { EUR: 0, USD: 0 },
    features: [
      "Jusqu'à 2 étudiants",
      'Optimisation de base',
      'Support par email',
    ],
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

// types souples
type PlanKey = 'free' | 'starter' | 'pro' | 'magic';

type FeatureRow =
  | { kind: 'section'; label: string }
  | {
      kind: 'feature';
      label: string;
      tooltip?: string;
      values: Partial<Record<PlanKey, CellValue>>;
    };

// entêtes (si tu ne les as pas déjà)
const HEADERS: { key: PlanKey; label: string }[] = [
  { key: 'free', label: 'Gratuit' },
  { key: 'starter', label: 'Starter' },
  { key: 'pro', label: 'Pro' },
  { key: 'magic', label: 'Full Magic' },
];

// garde de type
function isFeature(
  row: FeatureRow
): row is Extract<FeatureRow, { kind: 'feature' }> {
  return row.kind === 'feature';
}

function renderCell(label: string, v: CellValue) {
  // Booléens → icônes
  if (v === true) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 mx-auto leading-none">
        <Check
          className="block"
          style={{ color: '#8920d1' }}
          width="70%"
          height="70%"
          strokeWidth={3}
        />
      </span>
    );
  }
  if (v === false) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 mx-auto leading-none">
        <X
          className="block text-rose-600"
          width="70%"
          height="70%"
          strokeWidth={2}
        />
      </span>
    );
  }

  // "extra" → ✓ + " + frais "
  if (v === 'extra') {
    return (
      <span className="inline-flex items-center justify-center gap-1 mx-auto text-xs md:text-sm leading-none bg-white">
        <Check
          className="block"
          style={{ color: '#d400ff' }}
          width={10}
          height={10}
          strokeWidth={1.75}
        />
        + frais
      </span>
    );
  }

  // Numérique / texte → badge brand formaté
  const txt = formatValueByLabel(label, v);
  if (txt === '—') return <span className="text-black/30">—</span>;

  return (
    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r from-primary to-[#d400ff]">
      {txt}
    </span>
  );
}

// index par id
const planById: Record<PlanKey, (typeof PLANS)[number]> = {
  free: PLANS.find((p) => p.id === 'free')!,
  starter: PLANS.find((p) => p.id === 'starter')!,
  pro: PLANS.find((p) => p.id === 'pro')!,
  magic: PLANS.find((p) => p.id === 'magic')!,
};

// dérive un niveau d'optimisation depuis les features textuelles
function optimizationLevel(p: (typeof PLANS)[number]): 'Basique' | 'Supérieur' {
  const f = (p.features || []).join(' ').toLowerCase();
  return f.includes('avanc') ? 'Supérieur' : 'Basique';
}

function studentsMax(p: (typeof PLANS)[number]): number | 'Illimité' {
  return p.maxStudents == null ? 'Illimité' : p.maxStudents;
}

function hasPrioritySupport(p: (typeof PLANS)[number]): boolean {
  return (p.features || []).some((s) =>
    s.toLowerCase().includes('support prioritaire')
  );
}

function hasBranding(p: (typeof PLANS)[number]): boolean {
  return (p.features || []).some((s) => s.toLowerCase().includes('logo'));
}

function hasCustomNoFee(p: (typeof PLANS)[number]): boolean {
  return (p.features || []).some(
    (s) =>
      s.toLowerCase().includes('sur-mesure') ||
      s.toLowerCase().includes('sans supplément')
  );
}

const ROWS: FeatureRow[] = [
  { kind: 'section', label: 'Capacités & limites' },
  {
    kind: 'feature',
    label: 'Étudiants max',
    tooltip: "Nombre d'élèves gérés en parallèle",
    values: {
      free: studentsMax(planById.free), // 2
      starter: studentsMax(planById.starter), // 4
      pro: studentsMax(planById.pro), // 8
      magic: studentsMax(planById.magic), // Illimité
    },
  },
  {
    kind: 'feature',
    label: 'Étudiants illimités',
    values: {
      free: false,
      starter: false,
      pro: false,
      magic: studentsMax(planById.magic) === 'Illimité',
    },
  },

  { kind: 'section', label: 'Optimisation & productivité' },
  {
    kind: 'feature',
    label: "Niveau d'optimisation",
    values: {
      free: optimizationLevel(planById.free), // "Base"
      starter: optimizationLevel(planById.starter), // "Base"
      pro: optimizationLevel(planById.pro), // "Avancée"
      magic: optimizationLevel(planById.magic), // "Avancée"
    },
  },
  {
    kind: 'feature',
    label: 'Heures gagnées moy. (h/sem/élève)',
    tooltip:
      'Valeur moyenne indicative des heures supplémentaires effectuées et rémunérées grâce à DingDog, calculée en fonction du nombre d’élèves par semaine.',
    values: {
      free: planById.free.hoursSavedAvg, // 0.1
      starter: planById.starter.hoursSavedAvg, // 0.3
      pro: planById.pro.hoursSavedAvg, // 0.45
      magic: planById.magic.hoursSavedAvg, // 0.7
    },
  },

  { kind: 'section', label: 'Support' },
  {
    kind: 'feature',
    label: 'Support email',
    values: { free: true, starter: true, pro: true, magic: true },
  },
  {
    kind: 'feature',
    label: 'Support prioritaire (email & téléphone)',
    values: {
      free: false,
      starter: hasPrioritySupport(planById.starter),
      pro: hasPrioritySupport(planById.pro),
      magic: hasPrioritySupport(planById.magic),
    },
  },

  { kind: 'section', label: 'Personnalisation' },
  {
    kind: 'feature',
    label: 'Logo personnel / branding',
    values: {
      free: false,
      starter: hasBranding(planById.starter),
      pro: hasBranding(planById.pro),
      magic: hasBranding(planById.magic), // true
    },
  },
  {
    kind: 'feature',
    label: 'Fonctionnalités sur-mesure (sans supplément)',
    values: {
      free: false,
      starter: hasCustomNoFee(planById.starter),
      pro: hasCustomNoFee(planById.pro),
      magic: hasCustomNoFee(planById.magic), // true
    },
  },

  // { kind: 'section', label: 'Tarifs publics' },
  // {
  //   kind: 'feature',
  //   label: 'Mensuel (EUR)',
  //   values: {
  //     free: planById.free.prices.EUR, // 0
  //     starter: planById.starter.prices.EUR, // 8
  //     pro: planById.pro.prices.EUR, // 17
  //     magic: planById.magic.prices.EUR, // 32
  //   },
  // },
  // {
  //   kind: 'feature',
  //   label: 'Mensuel (USD)',
  //   values: {
  //     free: planById.free.prices.USD, // 0
  //     starter: planById.starter.prices.USD, // 9
  //     pro: planById.pro.prices.USD, // 19
  //     magic: planById.magic.prices.USD, // 38
  //   },
  // },
];

type Logo = {
  name: string;
  src: string; // ex: '/logos/acme.svg'
  href?: string;
};

const DEFAULT_LOGOS: Logo[] = [
  // {
  //   name: 'Belectric Italia',
  //   src: '/trustedby/belectric_italia.jpeg',
  //   href: 'https://belectric.com/belectric-italia/',
  // },
  // {
  //   name: 'GOLDBECK SOLAR GmbH',
  //   src: '/trustedby/goldbecksolar.jpg',
  //   href: 'https://goldbecksolar.com/en/our-services/om-operation-maintenance/',
  // },
  // {
  //   name: 'Ingeteam',
  //   src: '/trustedby/ingeteam.jpg',
  //   href: 'https://www.ingeteam.com/en-us/sectors/photovoltaic-energy/p15_24_343/operation-and-maintenance-solar-photovoltaic-power.aspx',
  // },
  // {
  //   name: 'Photosol',
  //   src: '/trustedby/photosol.png',
  //   href: 'https://www.photosol.fr/en/solutions/om-services-for-solar-parks/',
  // },
  {
    name: 'babylangues',
    src: '/trustedby/babylangues.jpg',
    href: 'https://www.babylangues.com/en/babylangues-france/',
  },
  {
    name: 'Portugues Et Cetera',
    src: '/trustedby/portuguesetcetera.png',
    href: 'https://www.portuguesetcetera.com/portuguese-courses/home-course',
  },
  {
    name: 'Home Music Teachers',
    src: '/trustedby/Home-music-teacher.svg',
    href: 'https://www.home-music-teachers.de/',
  },
  {
    name: 'InterDialog',
    src: '/trustedby/interdialog.jpg',
    href: 'https://www.interdialog.it/corsi-a-domicilio-e-sede-aziendale',
  },
];

function TrustedBy({
  className,
  logos = DEFAULT_LOGOS,
  title = 'Ils nous font confiance',
  subtitle = 'Utilisé dans des organisations exigeantes, en France, Italie, Portugal et Allemagne.',
}: {
  className?: string;
  logos?: Logo[];
  title?: string;
  subtitle?: string;
}) {
  // Duplique les logos pour la bande mobile défilable (illusion d’infini)
  const marquee = [...logos, ...logos];

  return (
    <section id="comparison" className={cn('px-6 md:px-10', className)}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-center text-muted-foreground mt-2">{subtitle}</p>

        {/* Grille desktop */}
        <div className="mt-8 hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 items-center">
          {logos.map((logo) => (
            <LogoTile key={logo.name} logo={logo} />
          ))}
        </div>

        {/* Bande défilante (mobile) */}
        <div className="sm:hidden relative mt-8 overflow-hidden border-y border-brand/20">
          <div
            className="flex items-center gap-8 animate-[marquee_25s_linear_infinite]"
            style={{ width: 'max-content' }}
            aria-hidden="true"
          >
            {marquee.map((logo, i) => (
              <LogoInline key={`${logo.name}-${i}`} logo={logo} />
            ))}
          </div>
          {/* Masques dégradés aux bords */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[rgba(137,32,209,0.08)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[rgba(212,0,255,0.08)] to-transparent" />
        </div>
      </div>

      {/* Keyframes Tailwind via classes arbitraires */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}

function LogoTile({ logo }: { logo: Logo }) {
  const img = (
    <Image
      src={logo.src}
      alt={logo.name}
      width={160}
      height={48}
      className="h-8 w-auto mx-auto opacity-70 hover:opacity-100 transition will-change-transform dark:invert-[.85]"
      priority={false}
    />
  );
  return (
    <div className="flex items-center justify-center">
      {logo.href ? (
        <Link href={logo.href} aria-label={logo.name} className="shrink-0">
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );
}

function LogoInline({ logo }: { logo: Logo }) {
  const img = (
    <Image
      src={logo.src}
      alt={logo.name}
      width={128}
      height={40}
      className="h-8 w-auto opacity-70 hover:opacity-100 transition dark:invert"
    />
  );
  return logo.href ? (
    <Link href={logo.href} aria-label={logo.name} className="shrink-0">
      {img}
    </Link>
  ) : (
    <div className="shrink-0">{img}</div>
  );
}

export function PlanComparison({ className }: { className?: string }) {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email') as string;
    toast('Demande envoyée', {
      description: `Nous vous contacterons à ${email}.`,
    });
    e.currentTarget.reset();
  }
  const sectionBg: Record<string, string> = {
    'Capacités & limites': 'flex pl-4',
    'Optimisation & productivité': 'flex pl-4',
    Support: 'flex pl-4',
    Personnalisation: 'flex pl-4',
    'Tarifs publics': 'flex pl-4',
  };
  return (
    <main className="px-6 md:px-10">
      {/* SECTION 1 — Comparatif */}
      <section className="mx-auto w-full max-w-6xl py-14 md:py-20">
        <div className={cn('relative', className)}>
          {/* Desktop: tableau premium */}
          <div className="hidden md:block">
            <div className="rounded-3xl overflow-hidden border border-black/10 shadow-sm bg-white">
              {/* Header dégradé plein */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-[#d400ff] text-white">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '44% repeat(4, 14%)',
                    minWidth: 900,
                  }}
                >
                  <div className="px-4 py-4 text-left font-semibold">
                    Fonctionnalité
                  </div>
                  {HEADERS.map((h) => (
                    <div
                      key={h.key}
                      className="px-3 py-4 text-center font-semibold"
                    >
                      {h.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Corps en grid, zebra rows */}
              <div className="divide-y divide-black/5">
                {ROWS.map((row, i) =>
                  !isFeature(row) ? (
                    // Ruban de section (plein dégradé)
                    <div
                      key={`sec-${i}`}
                      className="bg-gradient-to-r from-primary/90 to-[#d400ff]/90"
                    >
                      <div
                        className="grid text-white"
                        style={{
                          gridTemplateColumns: '44% repeat(4, 14%)',
                          minWidth: 900,
                        }}
                      >
                        <div className="px-4 py-2 col-span-5 font-semibold uppercase tracking-wide text-[12px]">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                            {row.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`feat-${row.label}`}
                      className={cn(
                        'grid odd:bg-white even:bg-black/[0.02] hover:bg-black/[0.04] transition-colors'
                      )}
                      style={{
                        gridTemplateColumns: '44% repeat(4, 14%)',
                        minWidth: 900,
                      }}
                    >
                      {/* Colonne label sticky avec fond blanc */}
                      <div className="px-4 py-3 bg-white sticky left-0 z-[1]">
                        <div className="flex items-start gap-2">
                          <span className="text-black/85">{row.label}</span>
                          {row.tooltip && (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger
                                  aria-label="Plus d'infos"
                                  className="mt-0.5"
                                >
                                  <Info
                                    className="h-4 w-4"
                                    style={{ color: '#8920d1' }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[260px] text-xs bg-white text-black border border-[#d400ff]/40 shadow-lg">
                                  {row.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>

                      {/* Cellules plans */}
                      {HEADERS.map((h) => (
                        <div
                          key={h.key}
                          className="px-3 py-3 text-center align-middle tabular-nums"
                        >
                          {renderCell(
                            row.label,
                            row.values?.[h.key] as CellValue
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
            {/* Note optionnelle */}
            {/* <p className="mt-3 text-xs text-center text-black/50">Les éléments marqués “+ frais” peuvent entraîner des coûts additionnels.</p> */}
          </div>

          {/* Mobile: cartes par plan (plus lisible qu’un tableau scroll) */}
          <div className="md:hidden space-y-6">
            {HEADERS.map((h) => (
              <div
                key={h.key}
                className="rounded-2xl border border-black/10 bg-white/85 backdrop-blur shadow-sm overflow-hidden"
              >
                {/* En-tête de carte */}
                <div className="bg-gradient-to-r from-primary to-[#d400ff] p-4">
                  <h3 className="text-white font-semibold text-center">
                    {h.label}
                  </h3>
                </div>

                {/* Features listées pour ce plan */}
                <ul className="p-4 space-y-3">
                  {ROWS.filter((r) => isFeature(r)).map((row) => {
                    const val = row.values?.[h.key] as CellValue;
                    const isBool = typeof val === 'boolean';
                    const txt = !isBool
                      ? formatValueByLabel(row.label, val)
                      : null;
                    const truthy = isTruthyValue(val);

                    return (
                      <li key={row.label} className="flex items-start gap-2">
                        {/* Icône / puce à gauche */}
                        {isBool ? (
                          truthy ? (
                            <Check className="mt-0.5 h-4 w-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <X className="mt-0.5 h-4 w-4 text-black/30 flex-shrink-0" />
                          )
                        ) : (
                          <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-primary to-[#d400ff] flex-shrink-0" />
                        )}

                        {/* Contenu */}
                        <div className="flex-1">
                          {/* Ligne principale: libellé + (badge éventuel) + (icône tooltip) */}
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-black/85">{row.label}</span>

                            {/* Badge valeur à CÔTÉ du libellé */}
                            {!isBool && txt && txt !== '—' && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white bg-gradient-to-r from-primary to-[#d400ff]">
                                {txt}
                              </span>
                            )}

                            {/* Icône / info (optionnel) */}
                            {row.tooltip && (
                              <span className="text-[11px] text-black/50">
                                {/* si tu utilises Tooltip, remets ton composant ici.
                   sinon, garde ce petit résumé, ou supprime-le */}
                              </span>
                            )}
                          </div>

                          {/* Tooltip texte en dessous (facultatif) */}
                          {row.tooltip && (
                            <div className="text-[11px] text-black/55 mt-1">
                              {row.tooltip}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* SEPARATOR */}{' '}
      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-primary"
      />
      {/* SECTION 2 — FAQ */}
      <section
        id="faq"
        className="relative mx-auto w-full max-w-3xl px-4 py-14 md:py-20"
      >
        {/* Halo décoratif (réutilise ta classe brand) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-brand-radial"
        />

        <div className="relative">
          <div className="mx-auto max-w-[46rem] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground/90 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>FAQ</span>
            </div>

            <h2 className="mt-3 bg-gradient-to-r from-primary to-[#d400ff] bg-clip-text text-[clamp(1.6rem,1.2rem+1.3vw,2.1rem)] font-bold tracking-tight text-transparent">
              Foire aux questions
            </h2>

            <p className="mt-2 text-muted-foreground">
              Tout ce qu’il faut savoir sur les plans, la facturation et le
              déploiement.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-8 w-full rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 shadow-sm"
          >
            {/* Item */}
            <AccordionItem
              value="who-for"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto data-[state=open]:text-foreground">
                <span className="font-medium">À qui s’adresse l’outil ?</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Aux professeurs indépendants et aux agences/écoles (langues,
                musique, soutien scolaire, auto-écoles, etc.) qui veulent une
                page de réservation professionnelle et un planning optimisé pour
                remplir un maximum de créneaux.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="public-booking"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Proposez-vous une page de réservation publique ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Oui. Les élèves réservent via votre page et renseignent leurs
                disponibilités
                <span className="text-primary font-semibold">
                  {' '}
                  chaque semaine
                </span>
                . Ils ne paient pas sur la plateforme : seuls le professeur ou
                l’agence s’abonnent pour utiliser le service.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="payments"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Qui paie et comment ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                L’abonnement est payé par le professeur ou l’agence (Stripe).
                Les élèves n’ont aucun paiement à effectuer. EUR et USD sont
                pris en charge.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="planning-scope"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Gérez-vous les lieux ou les temps de trajet ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Non, nous gérons uniquement le{' '}
                <span className="text-primary font-semibold">planning</span>. Si
                vous souhaitez inclure le calcul de trajets,
                <span className="text-primary font-semibold">
                  {' '}
                  contactez le support
                </span>{' '}
                : nous l’activerons gratuitement sur
                <span className="text-primary font-semibold">
                  {' '}
                  votre compte
                </span>
                .
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="optimization"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Comment l’outil aide à remplir plus de créneaux ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Le moteur priorise intelligemment les demandes (ex. créneaux «
                orphelins ») et protège vos
                <span className="text-primary italic"> buffers </span>entre
                cours pour éviter les enchaînements impossibles. Objectif : un
                agenda compact, fluide, presque…{' '}
                <span className="text-primary font-semibold">magique</span>.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="groups"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Gérez-vous les cours collectifs ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Pas encore. Le produit cible aujourd’hui les cours individuels.
                Les collectifs sont prévus sur la feuille de route.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="calendar-sync"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Puis-je synchroniser Google/Outlook ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Pas de synchronisation d’agenda pour le moment. Cette
                intégration n’est pas disponible pour l'instant.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="cancellations"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Comment gérez-vous les annulations et remplacements ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Lorsqu’un élève annule, le créneau est{' '}
                <span className="text-primary font-semibold">
                  instantanément
                </span>{' '}
                proposé à un élève ayant indiqué sa disponibilité à cette heure.
                Le professeur voit le créneau comme{' '}
                <span className="text-primary font-semibold">remplacé</span>{' '}
                uniquement après confirmation via l’email de notification.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="roles"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Y a-t-il des rôles utilisateurs et le multi-prof ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Oui :{' '}
                <span className="text-primary font-semibold">
                  admin d’agence
                </span>
                ,<span className="text-primary font-semibold"> professeur</span>{' '}
                et
                <span className="text-primary font-semibold"> étudiant</span>.
                Le
                <span className="text-primary font-semibold">
                  {' '}
                  mode multi-prof
                </span>{' '}
                est disponible (attribution simple, filtres par prof) ; une
                version{' '}
                <span className="text-primary font-semibold">avancée</span>{' '}
                arrivera plus tard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="support"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Comment fonctionne le support et la facturation ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Pas de factures générées dans l’app pour le moment. Nous
                envoyons un récapitulatif par email et notre support répond en
                <span className="text-primary font-semibold">
                  {' '}
                  moins de 24&nbsp;h
                </span>
                .
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="security"
              className="group/it border-b last:border-b-0"
            >
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Où sont hébergées les données ? Êtes-vous conformes RGPD ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Hébergement dans l’UE et conformité RGPD. Vous gardez la
                propriété de vos données et pouvez demander une exportation à
                tout moment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="trial-pricing" className="group/it">
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto">
                Y a-t-il un essai gratuit et quels sont les plans ?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                Essai <span className="text-primary font-semibold">1 mois</span>{' '}
                sans carte. Quatre paliers :
                <span className="text-primary italic"> Gratuit</span>,
                <span className="text-primary italic"> Starter</span>,
                <span className="text-primary italic"> Pro</span>,
                <span className="text-primary italic"> Full Magic</span>. Vous
                pouvez changer de plan à tout moment.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-gradient-to-r from-brand/30 via-border to-brand/30"
      />
      {/* <TrustedBy /> */}
      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-gradient-to-r from-brand/30 via-border to-brand/30"
      />
      {/* SECTION 3 — CTA final */}
      <section
        id="cta"
        lang="fr"
        aria-label="Appel à l'action"
        className="relative mx-auto w-full max-w-5xl px-4 py-14 md:py-20 overflow-x-hidden"
      >
        {/* Halo radial derrière le contenu */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-brand-radial"
        />

        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-[marquee_25s_linear_infinite] {
              animation: none;
              transform: none;
            }
          }
        `}</style>

        <div className="relative mx-auto max-w-5xl">
          <Card className="border-brand/40 bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/40">
            <CardContent className="py-8 md:py-12">
              <div className="grid gap-8 md:grid-cols-2 md:items-start">
                {/* Colonne texte */}
                <div className="space-y-4 break-words">
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground/90 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="whitespace-normal break-words">
                      DingDog • Optimisez chaque créneau
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance leading-relaxed">
                    <span className="bg-gradient-to-r from-primary to-[#d400ff] bg-clip-text text-transparent">
                      La réservation pro
                    </span>{' '}
                    qui remplit votre agenda (sans chaos).
                  </h2>

                  <p className="text-pretty text-muted-foreground leading-relaxed">
                    Page de réservation pour vos élèves, collecte de
                    disponibilités hebdomadaires, et moteur qui compacte vos
                    horaires intelligemment. Résultat : moins de trous, plus
                    d’élèves servis.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      asChild
                      size="lg"
                      className="bg-brand-gradient hover:opacity-95 border-0 text-white shadow"
                    >
                      <Link
                        href="/sign-up"
                        aria-label="Démarrer l’essai gratuit"
                      >
                        Tester 1 mois gratuitement
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-brand/40 text-foreground hover:bg-brand3/40 focus-visible:ring-brand"
                    >
                      <Link
                        href="/demo"
                        aria-label="Voir un exemple de planning optimisé"
                      >
                        Voir un exemple <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* ===== Avantages : liste WRAP sur mobile / MARQUEE dès sm ===== */}
                  {/* Mobile: liste qui wrap (aucun débordement possible) */}
                  <div className="sm:hidden mt-4">
                    <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground/90">
                      <li className="shrink min-w-0">
                        Page de réservation professionnelle
                      </li>
                      <li className="shrink min-w-0">
                        Priorisation des créneaux « orphelins »
                      </li>
                      <li className="shrink min-w-0">
                        Remplacement automatique des annulations
                      </li>
                      <li className="shrink min-w-0">
                        Buffers protégés entre cours
                      </li>
                      <li className="shrink min-w-0">
                        Mode multi-prof (basique)
                      </li>
                      <li className="shrink min-w-0">EUR et USD</li>
                      <li className="shrink min-w-0">
                        Essai 1 mois sans carte
                      </li>
                    </ul>
                  </div>

                  {/* ≥ sm: ruban défilant, clipé proprement */}
                  <div className="relative mt-4 overflow-hidden hidden sm:block">
                    <div className="flex w-[200%] animate-[marquee_25s_linear_infinite] gap-6 whitespace-nowrap text-sm text-muted-foreground/90 will-change-transform">
                      <span>Page de réservation professionnelle</span>•
                      <span>Priorisation des créneaux « orphelins »</span>•
                      <span>Remplacement automatique des annulations</span>•
                      <span>Buffers protégés entre cours</span>•
                      <span>Mode multi-prof (basique)</span>•
                      <span>EUR et USD</span>•
                      <span>Essai 1 mois sans carte</span>•
                      {/* duplication pour boucler */}
                      <span>Page de réservation professionnelle</span>•
                      <span>Priorisation des créneaux « orphelins »</span>•
                      <span>Remplacement automatique des annulations</span>•
                      <span>Buffers protégés entre cours</span>•
                      <span>Mode multi-prof (basique)</span>•
                      <span>EUR et USD</span>•
                      <span>Essai 1 mois sans carte</span>
                    </div>
                  </div>
                  {/* ===== /Avantages ===== */}
                </div>

                {/* Colonne formulaire (stack en mobile) */}
                <form className="grid gap-3">
                  <label className="text-sm font-medium" htmlFor="email">
                    Recevoir mon lien de démo
                  </label>
                  <div className="flex gap-2 w-full max-sm:flex-col">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="vous@ecole-ou-agence.com"
                      className="w-full min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    />
                    <Button type="submit" className="max-sm:w-full shrink-0">
                      Envoyer
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-pretty">
                    Nous envoyons un lien de démo et des exemples de plannings.
                    Pas de spam, désinscription en un clic.
                  </p>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Micro-footer */}
          <div className="mt-8 border-t border-border/60 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-center md:text-left">
            <p className="text-xs text-muted-foreground text-pretty">
              Abonnement payé par le professeur ou l’agence. EUR/USD
              disponibles. Essai gratuit 1 mois sans carte.
            </p>
            <nav className="text-sm">
              <ul className="flex flex-wrap items-center justify-center gap-4">
                <li>
                  <Link href="/legal/terms" className="hover:underline">
                    Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:underline">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/legal/dpa" className="hover:underline">
                    DPA / RGPD
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PlanComparison;
