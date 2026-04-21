// app/pricing/plan-comparison.tsx
'use client';

import { cn } from '@/lib/utils';
import { Check, X, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Plan = {
  id: 'free' | 'magic';
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

// ✅ Format robuste : basé sur "rowId" (pas sur le label traduit)
function formatValueByRowId(
  rowId: string,
  v: CellValue,
  t: (key: string) => string
): string {
  if (v === null || v === undefined) return '—';

  if (rowId === 'hoursSaved' && typeof v === 'number') {
    return `${v.toFixed(2)} ${t('comparison.units.hoursShort')}`;
  }

  if (rowId === 'maxStudents') {
    if (v === Infinity) return t('comparison.values.unlimited');
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v;
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

type PlanKey = 'free' | 'magic';

type FeatureRow =
  | { kind: 'section'; label: string }
  | {
      kind: 'feature';
      id: string; // ✅ identifiant stable
      label: string;
      tooltip?: string;
      values: Partial<Record<PlanKey, CellValue>>;
    };

function isFeature(
  row: FeatureRow
): row is Extract<FeatureRow, { kind: 'feature' }> {
  return row.kind === 'feature';
}

function renderCell(rowId: string, v: CellValue, t: (key: string) => string) {
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

  // "extra" → ✓ + "+ fee"
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
        {t('comparison.values.extraFee')}
      </span>
    );
  }

  const txt = formatValueByRowId(rowId, v, t);
  if (txt === '—') return <span className="text-black/30">—</span>;

  return (
    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r from-primary to-[#d400ff]">
      {txt}
    </span>
  );
}

function PlanComparison({ className }: { className?: string }) {
  const t = useTranslations('comparison');

  // Plans (titres/features traduits si tu veux les réutiliser ailleurs)
  const PLANS: Plan[] = [
    {
      id: 'free',
      title: t('comparison.plans.free.title'),
      prices: { EUR: 0, USD: 0 },
      features: [
        t('comparison.plans.free.features.0'),
        t('comparison.plans.free.features.1'),
        t('comparison.plans.free.features.2'),
        t('comparison.plans.free.features.3'),
      ],
      hoursSavedAvg: 0.1,
      maxStudents: 2,
    },
    {
      id: 'magic',
      title: t('comparison.plans.magic.title'),
      prices: {
        EUR: Number(process.env.NEXT_PUBLIC_PRICE_EUR),
        USD: Number(process.env.NEXT_PUBLIC_PRICE_DOL),
      },
      lookupKeys: { EUR: 'magic_monthly_eur', USD: 'magic_monthly_usd' },
      features: [
        t('comparison.plans.magic.features.0'),
        t('comparison.plans.magic.features.1'),
        t('comparison.plans.magic.features.2'),
        t('comparison.plans.magic.features.3'),
        t('comparison.plans.magic.features.4'),
        t('comparison.plans.magic.features.5'),
        t('comparison.plans.magic.features.6'),
        t('comparison.plans.magic.features.7'),
        t('comparison.plans.magic.features.8'),
      ],
      hoursSavedAvg: 0.7,
      maxStudents: null,
    },
  ];

  const planById: Record<PlanKey, (typeof PLANS)[number]> = {
    free: PLANS.find((p) => p.id === 'free')!,
    magic: PLANS.find((p) => p.id === 'magic')!,
  };

  const studentsMax = (p: (typeof PLANS)[number]) =>
    p.maxStudents == null
      ? t('comparison.values.unlimited')
      : String(p.maxStudents);

  // Entêtes
  const HEADERS: { key: PlanKey; label: string }[] = [
    { key: 'free', label: t('comparison.headers.free') },
    { key: 'magic', label: t('comparison.headers.magic') },
  ];

  // ✅ Rows traduites (labels + tooltips), valeurs stables
  const ROWS: FeatureRow[] = [
    { kind: 'section', label: t('comparison.sections.booking') },
    {
      kind: 'feature',
      id: 'selfBooking',
      label: t('comparison.rows.selfBooking.label'),
      tooltip: t('comparison.rows.selfBooking.tooltip'),
      values: { free: false, magic: true },
    },
    {
      kind: 'feature',
      id: 'smartGrouping',
      label: t('comparison.rows.smartGrouping.label'),
      tooltip: t('comparison.rows.smartGrouping.tooltip'),
      values: { free: false, magic: true },
    },

    { kind: 'section', label: t('comparison.sections.travel') },
    {
      kind: 'feature',
      id: 'travelTime',
      label: t('comparison.rows.travelTime.label'),
      tooltip: t('comparison.rows.travelTime.tooltip'),
      values: { free: false, magic: true },
    },
    {
      kind: 'feature',
      id: 'googleMaps',
      label: t('comparison.rows.googleMaps.label'),
      tooltip: t('comparison.rows.googleMaps.tooltip'),
      values: { free: false, magic: true },
    },
    {
      kind: 'feature',
      id: 'allInOne',
      label: t('comparison.rows.allInOne.label'),
      tooltip: t('comparison.rows.allInOne.tooltip'),
      values: { free: false, magic: true },
    },

    { kind: 'section', label: t('comparison.sections.optimization') },
    {
      kind: 'feature',
      id: 'organizationMode',
      label: t('comparison.rows.organizationMode.label'),
      values: {
        free: t('comparison.values.organizationMode.free'),
        magic: t('comparison.values.organizationMode.magic'),
      },
    },
    {
      kind: 'feature',
      id: 'yourTime',
      label: t('comparison.rows.yourTime.label'),
      tooltip: t('comparison.rows.yourTime.tooltip'),
      values: {
        free: t('comparison.values.yourTime.free'),
        magic: t('comparison.values.yourTime.magic'),
      },
    },

    { kind: 'section', label: t('comparison.sections.support') },
    {
      kind: 'feature',
      id: 'notAlone',
      label: t('comparison.rows.notAlone.label'),
      values: {
        free: t('comparison.values.notAlone.free'),
        magic: t('comparison.values.notAlone.magic'),
      },
    },
    {
      kind: 'feature',
      id: 'customNoFee',
      label: t('comparison.rows.customNoFee.label'),
      values: { free: false, magic: true },
    },
    {
      kind: 'feature',
      id: 'growth',
      label: t('comparison.rows.growth.label'),
      values: {
        free: t('comparison.values.growth.limited'),
        magic:
          studentsMax(planById.magic) === t('comparison.values.unlimited')
            ? t('comparison.values.unlimited')
            : t('comparison.values.growth.scalable'),
      },
    },

    { kind: 'section', label: t('comparison.sections.branding') },
    {
      kind: 'feature',
      id: 'clientPerception',
      label: t('comparison.rows.clientPerception.label'),
      values: {
        free: t('comparison.values.clientPerception.free'),
        magic: t('comparison.values.clientPerception.magic'),
      },
    },
    {
      kind: 'feature',
      id: 'whatProspectsSee',
      label: t('comparison.rows.whatProspectsSee.label'),
      tooltip: t('comparison.rows.whatProspectsSee.tooltip'),
      values: {
        free: t('comparison.values.whatProspectsSee.free'),
        magic: t('comparison.values.whatProspectsSee.magic'),
      },
    },
  ];

  return (
    <main className="px-6 md:px-10">
      <section className="mx-auto w-full max-w-6xl py-14 md:py-20">
        <div className={cn('relative', className)}>
          {/* Desktop */}
          <div className="hidden md:block">
            <div className="rounded-3xl overflow-hidden border border-black/10 shadow-sm bg-white">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-[#d400ff] text-white">
                <div
                  className="grid"
                  style={{ gridTemplateColumns: '50% 25% 25%', minWidth: 640 }}
                >
                  <div className="px-4 py-4 text-left font-semibold">
                    {t('comparison.table.featureHeader')}
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

              <div className="divide-y divide-black/5">
                {ROWS.map((row, i) =>
                  !isFeature(row) ? (
                    <div
                      key={`sec-${i}`}
                      className="bg-gradient-to-r from-primary/90 to-[#d400ff]/90"
                    >
                      <div
                        className="grid text-white"
                        style={{
                          gridTemplateColumns: '50% 25% 25%',
                          minWidth: 640,
                        }}
                      >
                        <div className="px-4 py-2 col-span-3 font-semibold uppercase tracking-wide text-[12px]">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                            {row.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`feat-${row.id}`}
                      className={cn(
                        'grid odd:bg-white even:bg-black/[0.02] hover:bg-black/[0.04] transition-colors'
                      )}
                      style={{
                        gridTemplateColumns: '50% 25% 25%',
                        minWidth: 640,
                      }}
                    >
                      <div className="px-4 py-3 bg-white sticky left-0 z-[1]">
                        <div className="flex items-start gap-2">
                          <span className="text-black/85">{row.label}</span>

                          {row.tooltip && (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger
                                  aria-label={t('comparison.table.moreInfo')}
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

                      {HEADERS.map((h) => (
                        <div
                          key={h.key}
                          className="px-3 py-3 text-center align-middle tabular-nums"
                        >
                          {renderCell(
                            row.id,
                            row.values?.[h.key] as CellValue,
                            t
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-6">
            {HEADERS.map((h) => (
              <div
                key={h.key}
                className="rounded-2xl border border-black/10 bg-white/85 backdrop-blur shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary to-[#d400ff] p-4">
                  <h3 className="text-white font-semibold text-center">
                    {h.label}
                  </h3>
                </div>

                <ul className="p-4 space-y-3">
                  {ROWS.filter((r) => isFeature(r)).map((row) => {
                    const val = row.values?.[h.key] as CellValue;
                    const isBool = typeof val === 'boolean';
                    const txt = !isBool
                      ? formatValueByRowId(row.id, val, t)
                      : null;
                    const truthy = isTruthyValue(val);

                    return (
                      <li key={row.id} className="flex items-start gap-2">
                        {isBool ? (
                          truthy ? (
                            <Check className="mt-0.5 h-4 w-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <X className="mt-0.5 h-4 w-4 text-black/30 flex-shrink-0" />
                          )
                        ) : (
                          <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-primary to-[#d400ff] flex-shrink-0" />
                        )}

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-black/85">{row.label}</span>

                            {!isBool && txt && txt !== '—' && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white bg-gradient-to-r from-primary to-[#d400ff]">
                                {txt}
                              </span>
                            )}
                          </div>

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

      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-primary"
      />
    </main>
  );
}

export default PlanComparison;
