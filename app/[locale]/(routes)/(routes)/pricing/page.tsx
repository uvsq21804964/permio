// app/pricing/plan-comparison.tsx
'use client';

import { cn } from '@/lib/utils'; // optionnel
import { Check, X, Minus } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// types souples
type PlanKey = 'free' | 'starter' | 'pro' | 'magic';
type CellValue = boolean | 'extra' | number | string | null | undefined;

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

// rendu générique de cellule
function renderCell(v: CellValue) {
  // Ajuste aussi la padding des cellules si besoin :
  // <TableCell className="text-center align-middle p-3 md:p-4">…

  if (v === true)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 mx-auto leading-none">
        {/* ✓ violet, plus gros et trait plus épais */}
        <Check
          className="block"
          style={{ color: '#8920d1' }}
          width="70%"
          height="70%"
          strokeWidth={3}
        />
      </span>
    );

  if (v === false)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 mx-auto leading-none">
        {/* ✗ rouge, plus gros et trait plus épais */}
        <X
          className="block text-rose-600"
          width="70%"
          height="70%"
          strokeWidth={2}
        />
      </span>
    );

  if (v === 'extra')
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

  if (typeof v === 'number')
    return (
      <span className="mx-auto text-center tabular-nums leading-none block">
        {v}
      </span>
    );
  if (typeof v === 'string')
    return <span className="mx-auto text-center leading-none block">{v}</span>;
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 mx-auto leading-none">
      <X
        className="block text-rose-600"
        width="100%"
        height="100%"
        strokeWidth={2.75}
      />
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
    tooltip: 'Valeurs issues de hoursSavedAvg (approx.)',
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
          {/* Halo décoratif */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-brand-radial -z-10"
          />

          {/* Wrapper scroll + recentrage du contenu */}
          <div
            className="relative z-10 overflow-x-auto rounded-md border"
            style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Astuce: mx-auto pour centrer le tableau quand sa largeur est > conteneur */}
            <Table className="min-w-[820px] table-fixed mx-auto bg-primary/40">
              {/* Légende (réactivée + mieux centrée) */}
              {/* <TableCaption
                className="text-center text-balance px-3"
                style={{ captionSide: 'top' as any }}
              >
                Comparatif des fonctionnalités par plan
              </TableCaption> */}

              {/* En-têtes */}
              <TableHeader className="sticky top-0 z-[1] bg-[linear-gradient(180deg,rgba(137,32,209,0.10),transparent)]">
                <TableRow>
                  {/* Colonne label: 44% */}
                  <TableHead className="w-[44%] md:sticky md:left-0 md:z-[2] bg-background md:bg-background/90 md:backdrop-blur supports-[backdrop-filter]:md:bg-background/60 border-l-4 border-brand pl-3">
                    Fonctionnalité
                  </TableHead>

                  {/* 4 colonnes restantes: 14% chacune = 56% */}
                  {HEADERS.map((h) => (
                    <TableHead
                      key={h.key}
                      scope="col"
                      className="w-[14%] text-center font-semibold tracking-tight bg-white"
                    >
                      {h.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {ROWS.map((row, i) =>
                  !isFeature(row) ? (
                    // SECTION — pas de tooltip ici
                    <TableRow
                      key={`sec-${i}`}
                      className={cn(sectionBg[row.label] ?? '')}
                    >
                      <TableCell
                        colSpan={1 + HEADERS.length}
                        className="font-semibold text-white"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full "
                            style={{
                              background:
                                'linear-gradient(90deg,#8920d1,#d400ff)',
                            }}
                          />
                          {row.label}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // FEATURE — tooltip OK ici
                    <TableRow
                      key={`feat-${row.label}`}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* Colonne label sticky */}
                      <TableCell className="whitespace-pre-wrap md:sticky md:left-0 md:z-[1] bg-background md:bg-background/95 md:backdrop-blur supports-[backdrop-filter]:md:bg-background/60">
                        <div className="flex items-start gap-2">
                          <span>{row.label}</span>
                          {row.tooltip && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger aria-label="Plus d'infos">
                                  <Info
                                    className="h-4 w-4"
                                    style={{ color: '#8920d1' }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[260px] text-xs bg-brand text-white border-0 shadow-lg">
                                  {row.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>

                      {/* Cellules plans: centrées + chiffres tabulaires + align-middle */}
                      {HEADERS.map((h) => (
                        <TableCell
                          key={h.key}
                          className="text-center align-middle tabular-nums bg-white"
                        >
                          {renderCell(row.values?.[h.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* Note (optionnelle) sous le tableau, centrée */}
          {/* <p className="mt-3 text-xs text-muted-foreground text-center">
            Les éléments marqués “+ frais” peuvent entraîner des coûts
            additionnels selon l’offre et l’implémentation.
          </p> */}
        </div>
      </section>
      {/* SEPARATOR */}{' '}
      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-gradient-to-r from-brand/30 via-border to-brand/30"
      />
      {/* SECTION 2 — FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl py-14 md:py-20">
        <h2 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-bold tracking-tight text-center">
          Foire aux questions
        </h2>
        <p className="text-muted-foreground text-center mt-2">
          Tout ce qu’il faut savoir sur les plans, la facturation et le
          déploiement.
        </p>

        {/* <Accordion type="single" collapsible className="mt-6 w-full">
          <AccordionItem value="trial">
            <AccordionTrigger>Y a-t-il un essai gratuit ?</AccordionTrigger>
            <AccordionContent>
              Oui. Vous pouvez démarrer avec un essai gratuit pour tester
              l’optimisation des créneaux, la planification par zones et la
              séparation préventif/curatif. Par défaut, l’essai se fait sans
              carte bancaire.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="who-for">
            <AccordionTrigger>À qui s’adresse la solution ?</AccordionTrigger>
            <AccordionContent>
              Aux équipes qui se déplacent chez leurs clients (ex. O&amp;M
              photovoltaïque, maintenance multi-sites, cours à domicile, etc.).
              Le but : réduire les kilomètres, caler le préventif vs le curatif
              et remplir chaque créneau au mieux.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-it-works">
            <AccordionTrigger>
              Comment fonctionne l’optimisation ?
            </AccordionTrigger>
            <AccordionContent>
              Vous définissez les disponibilités, zones d’intervention,
              compétences/équipes, priorités (curatif vs préventif) et
              contraintes horaires. Le moteur propose un planning regroupé par
              zones avec moins d’allers-retours inutiles.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="no-public-booking">
            <AccordionTrigger>
              Est-ce un outil de prise de rendez-vous public ?
            </AccordionTrigger>
            <AccordionContent>
              Non. Le produit se concentre sur l’optimisation à partir de
              disponibilités existantes et de contraintes opérationnelles. Il
              n’expose pas de widget public de réservation.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="import-data">
            <AccordionTrigger>
              Puis-je importer mes données actuelles ?
            </AccordionTrigger>
            <AccordionContent>
              Oui. Vous pouvez partir d’un fichier (CSV, feuille de calcul) ou
              de vos agendas existants pour créer rapidement les ressources,
              zones et interventions de départ.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pricing">
            <AccordionTrigger>
              Comment la tarification est-elle structurée ?
            </AccordionTrigger>
            <AccordionContent>
              Les formules reflètent le niveau d’optimisation et les
              intégrations disponibles. Vous pouvez commencer gratuitement et
              passer à un plan supérieur au besoin. La facturation EUR/USD est
              possible.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="change-cancel">
            <AccordionTrigger>
              Puis-je changer de plan ou résilier facilement ?
            </AccordionTrigger>
            <AccordionContent>
              Oui. Vous pouvez passer à un plan supérieur quand vous le
              souhaitez et ajuster votre abonnement à la fin de chaque période
              de facturation.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security">
            <AccordionTrigger>
              Où sont hébergées les données ? Êtes-vous conformes RGPD ?
            </AccordionTrigger>
            <AccordionContent>
              L’hébergement est réalisé dans l’UE et la solution est conçue pour
              respecter le RGPD. Vous gardez la propriété de vos données et
              pouvez demander une exportation à tout moment.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="support-onboarding">
            <AccordionTrigger>Quel accompagnement est prévu ?</AccordionTrigger>
            <AccordionContent>
              Support en ligne et base de connaissances. Les plans supérieurs
              peuvent inclure une aide au paramétrage (zones, compétences,
              contraintes) et de la formation pour accélérer le déploiement.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="roadmap">
            <AccordionTrigger>
              Quelles sont les prochaines étapes produit ?
            </AccordionTrigger>
            <AccordionContent>
              Améliorations du moteur (meilleur regroupement par zones,
              pondération des priorités curatif/préventif), intégrations
              calendaires approfondies, et API renforcée pour synchroniser vos
              systèmes métiers.
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}
        <Accordion type="single" collapsible className="mt-6 w-full">
          <AccordionItem value="who-for">
            <AccordionTrigger>À qui s’adresse l’outil ?</AccordionTrigger>
            <AccordionContent>
              Aux professeurs indépendants et aux agences/écoles (langues,
              musique, soutien scolaire, auto-écoles, etc.) qui veulent une page
              de réservation professionnelle et un planning optimisé pour
              remplir un maximum de créneaux.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="public-booking">
            <AccordionTrigger>
              Proposez-vous une page de réservation publique ?
            </AccordionTrigger>
            <AccordionContent>
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

          <AccordionItem value="payments">
            <AccordionTrigger>Qui paie et comment ?</AccordionTrigger>
            <AccordionContent>
              L’abonnement est payé par le professeur ou l’agence (Stripe). Les
              élèves n’ont aucun paiement à effectuer. EUR et USD sont pris en
              charge.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="planning-scope">
            <AccordionTrigger>
              Gérez-vous les lieux ou les temps de trajet ?
            </AccordionTrigger>
            <AccordionContent>
              Non, nous gérons uniquement le{' '}
              <span className="text-primary font-semibold">planning</span>. Si
              vous souhaitez inclure le calcul de trajets,{' '}
              <span className="text-primary font-semibold">
                contactez le support
              </span>{' '}
              : nous l’activerons gratuitement sur{' '}
              <span className="text-primary font-semibold">votre compte</span>.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="optimization">
            <AccordionTrigger>
              Comment l’outil aide à remplir plus de créneaux ?
            </AccordionTrigger>
            <AccordionContent>
              Le moteur priorise intelligemment les demandes (ex. créneaux «
              orphelins ») et protège vos
              <span className="text-primary italic"> buffers </span> entre cours
              pour éviter les enchaînements impossibles. Objectif : un agenda
              compact, fluide, presque…{' '}
              <span className="text-primary font-semibold">magique</span>.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="groups">
            <AccordionTrigger>
              Gérez-vous les cours collectifs ?
            </AccordionTrigger>
            <AccordionContent>
              Pas encore. Le produit cible aujourd’hui les cours individuels.
              Les collectifs sont prévus sur la feuille de route.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="calendar-sync">
            <AccordionTrigger>
              Puis-je synchroniser Google/Outlook ?
            </AccordionTrigger>
            <AccordionContent>
              Pas de synchronisation d’agenda pour le moment. Cette intégration
              n’est pas disponible au lancement.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cancellations">
            <AccordionTrigger>
              Comment gérez-vous les annulations et remplacements ?
            </AccordionTrigger>
            <AccordionContent>
              Lorsqu’un élève annule, le créneau est{' '}
              <span className="text-primary font-semibold">instantanément</span>{' '}
              proposé à un élève ayant indiqué sa disponibilité à cette heure.
              Le professeur voit le créneau comme{' '}
              <span className="text-primary font-semibold">remplacé </span>
              uniquement après que l’élève pressenti a confirmé sa participation
              via l’email de notification.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="roles">
            <AccordionTrigger>
              Y a-t-il des rôles utilisateurs et le multi-prof ?
            </AccordionTrigger>
            <AccordionContent>
              Oui :{' '}
              <span className="text-primary font-semibold">admin d’agence</span>
              , <span className="text-primary font-semibold">professeur</span>
              et <span className="text-primary font-semibold">étudiant</span>.
              Le{' '}
              <span className="text-primary font-semibold">
                mode multi-prof
              </span>{' '}
              est disponible (attribution simple, filtres par prof) ; une
              version{' '}
              <span className="text-primary font-semibold">avancée</span>{' '}
              arrivera plus tard.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="support">
            <AccordionTrigger>
              Comment fonctionne le support et la facturation ?
            </AccordionTrigger>
            <AccordionContent>
              Pas de factures générées dans l’app pour le moment. Nous envoyons
              un récapitulatif par email et notre support répond en{' '}
              <span className="text-primary font-semibold">moins de 24 h</span>{' '}
              pour toute demande liée à la facturation.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security">
            <AccordionTrigger>
              Où sont hébergées les données ? Êtes-vous conformes RGPD ?
            </AccordionTrigger>
            <AccordionContent>
              Hébergement dans l’UE et conformité RGPD. Vous gardez la propriété
              de vos données et pouvez demander une exportation à tout moment.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="trial-pricing">
            <AccordionTrigger>
              Y a-t-il un essai gratuit et quels sont les plans ?
            </AccordionTrigger>
            <AccordionContent>
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
        aria-label="Appel à l'action"
        className="mx-auto w-full max-w-5xl py-14 md:py-20"
      >
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
        <div className="mx-auto max-w-5xl">
          {/* Bloc principal */}
          <Card className="border-brand/40 shadow-sm">
            <CardContent className="py-10 md:py-12">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Prêt à réduire l’attente et à fluidifier vos files ?
                  </h2>
                  <p className="text-muted-foreground">
                    Lancez un essai gratuit ou planifiez une démonstration pour
                    découvrir comment optimiser vos parcours sur un ou plusieurs
                    emplacements.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      asChild
                      size="lg"
                      className="bg-brand-gradient hover:opacity-95 border-0 text-white shadow"
                    >
                      <Link href="/sign-up">Démarrer l’essai</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-brand/40 text-foreground hover:bg-brand3/40 focus-visible:ring-brand"
                    >
                      <Link href="/demo">Voir une démo</Link>
                    </Button>
                  </div>
                </div>

                {/* Formulaire rapide */}
                <form onSubmit={onSubmit} className="grid gap-3">
                  <label className="text-sm font-medium" htmlFor="email">
                    Recevoir une proposition personnalisée
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="vos.nom@entreprise.com"
                      className="flex-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    />
                    <Button type="submit">Envoyer</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En soumettant, vous acceptez d’être recontacté(e) par notre
                    équipe.
                  </p>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Micro-footer de la page Pricing */}
          <div className="mt-8 border-t border-border/60 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-center md:text-left">
            <p className="text-xs text-muted-foreground">
              Prix indiqués par emplacement. Taxes et options supplémentaires
              non incluses.
            </p>
            <nav className="text-sm">
              <ul className="flex flex-wrap items-center gap-4">
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
