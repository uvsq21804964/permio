// app/pricing/competitor-comparison.tsx
'use client';

import { cn } from '@/lib/utils';
import { Check, X, Info } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types souples pour les valeurs de cellule
type CellValue = boolean | number | string | null | undefined;

function formatValue(v: CellValue): string {
  if (v === null || v === undefined) return '—';
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

// Clés des colonnes
type ColumnKey = 'platforms' | 'allInOne' | 'freeTools' | 'ourTool';

// Ligne de section ou de feature
type FeatureRow =
  | { kind: 'section'; label: string }
  | {
      kind: 'feature';
      id: string; // ✅ stable (pas traduit)
      label: string;
      tooltip?: string;
      values: Partial<Record<ColumnKey, CellValue>>;
    };

const HEADERS_KEYS: ColumnKey[] = [
  'platforms',
  'allInOne',
  'freeTools',
  'ourTool',
];

// Garde de type
function isFeature(
  row: FeatureRow
): row is Extract<FeatureRow, { kind: 'feature' }> {
  return row.kind === 'feature';
}

function renderCell(v: CellValue, extraFeeLabel: string) {
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

  // Numérique / texte → badge
  const txt = formatValue(v);
  if (txt === '—') return <span className="text-black/30">—</span>;

  // Optionnel : si un jour tu mets "extra"
  if (txt.toLowerCase() === 'extra') {
    return (
      <span className="inline-flex items-center justify-center gap-1 mx-auto text-xs md:text-sm leading-none bg-white">
        <Check
          className="block"
          style={{ color: '#d400ff' }}
          width={10}
          height={10}
          strokeWidth={1.75}
        />
        {extraFeeLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r from-primary to-[#d400ff]">
      {txt}
    </span>
  );
}

export function CompetitorComparison({ className }: { className?: string }) {
  const t = useTranslations('valueProposition');
  const locale = useLocale();

  const priceEnv = locale.startsWith('fr')
    ? process.env.NEXT_PUBLIC_PRICE_EUR
    : process.env.NEXT_PUBLIC_PRICE_DOL;

  const priceNumber = priceEnv ? Number(priceEnv) : NaN;

  const ourToolPriceValue = Number.isFinite(priceNumber)
    ? `${priceNumber}${t('competitors.values.ourToolPrice')}`
    : '—';

  const ourToolPriceValueENFR = locale.startsWith('fr')
    ? ourToolPriceValue
    : '$' + ourToolPriceValue;

  const HEADERS: { key: ColumnKey; label: string; subtitle?: string }[] =
    HEADERS_KEYS.map((key) => ({
      key,
      label: t(`competitors.headers.${key}.label`),
      subtitle: t(`competitors.headers.${key}.subtitle`),
    }));

  const ROWS: FeatureRow[] = [
    { kind: 'section', label: t('competitors.sections.booking') },
    {
      kind: 'feature',
      id: 'bringsClients',
      label: t('competitors.rows.bringsClients.label'),
      tooltip: t('competitors.rows.bringsClients.tooltip'),
      values: {
        platforms: true,
        allInOne: t('competitors.values.sometimes'),
        freeTools: false,
        ourTool: true,
      },
    },
    {
      kind: 'feature',
      id: 'selfBookingLogicalSlots',
      label: t('competitors.rows.selfBookingLogicalSlots.label'),
      tooltip: t('competitors.rows.selfBookingLogicalSlots.tooltip'),
      values: {
        platforms: t('competitors.values.yesNoTravel'),
        allInOne: t('competitors.values.yesSimpleCalendar'),
        freeTools: false,
        ourTool: t('competitors.values.yesOptimizedWithTravel'),
      },
    },

    { kind: 'section', label: t('competitors.sections.travel') },
    {
      kind: 'feature',
      id: 'includesTravelTime',
      label: t('competitors.rows.includesTravelTime.label'),
      values: {
        platforms: false,
        allInOne: t('competitors.values.rarely'),
        freeTools: false,
        ourTool: true,
      },
    },
    {
      kind: 'feature',
      id: 'groupsByArea',
      label: t('competitors.rows.groupsByArea.label'),
      values: {
        platforms: false,
        allInOne: false,
        freeTools: false,
        ourTool: true,
      },
    },
    {
      kind: 'feature',
      id: 'dailyRouteInMaps',
      label: t('competitors.rows.dailyRouteInMaps.label'),
      values: {
        platforms: false,
        allInOne: false,
        freeTools: false,
        ourTool: true,
      },
    },

    { kind: 'section', label: t('competitors.sections.daily') },
    {
      kind: 'feature',
      id: 'timeSpentPlanning',
      label: t('competitors.rows.timeSpentPlanning.label'),
      tooltip: t('competitors.rows.timeSpentPlanning.tooltip'),
      values: {
        platforms: t('competitors.values.high'),
        allInOne: t('competitors.values.medium'),
        freeTools: t('competitors.values.veryHigh'),
        ourTool: t('competitors.values.veryLow'),
      },
    },
    {
      kind: 'feature',
      id: 'madeForInHome',
      label: t('competitors.rows.madeForInHome.label'),
      values: {
        platforms: false,
        allInOne: false,
        freeTools: false,
        ourTool: true,
      },
    },

    { kind: 'section', label: t('competitors.sections.price') },
    {
      kind: 'feature',
      id: 'realCost',
      label: t('competitors.rows.realCost.label'),
      tooltip: t('competitors.rows.realCost.tooltip'),
      values: {
        platforms: t('competitors.values.platformCommission'),
        allInOne: t('competitors.values.managementSoftwarePrice'),
        freeTools: t('competitors.values.basicToolsPrice'),
        ourTool: ourToolPriceValueENFR,
      },
    },
  ];

  return (
    <main className="px-6 md:px-10">
      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-primary"
      />

      <section className="mx-auto w-full max-w-6xl py-14 md:py-20">
        <div className={cn('relative', className)}>
          {/* Desktop */}
          <div className="hidden md:block">
            <div className="rounded-3xl overflow-hidden border border-black/10 shadow-sm bg-white">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-[#d400ff] text-white">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '28% 18% 18% 18% 18%',
                    minWidth: 960,
                  }}
                >
                  <div className="px-4 py-4 text-left font-semibold">
                    {t('competitors.table.marketSolutions')}
                  </div>

                  {HEADERS.map((h) => (
                    <div
                      key={h.key}
                      className="px-3 py-4 text-center font-semibold"
                    >
                      <div>{h.label}</div>
                      {h.subtitle && (
                        <div className="mt-1 text-xs font-normal text-white/80">
                          {h.subtitle}
                        </div>
                      )}
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
                          gridTemplateColumns: '28% 18% 18% 18% 18%',
                          minWidth: 960,
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
                      key={`feat-${row.id}`}
                      className={cn(
                        'grid odd:bg-white even:bg-black/[0.02] hover:bg-black/[0.04] transition-colors'
                      )}
                      style={{
                        gridTemplateColumns: '28% 18% 18% 18% 18%',
                        minWidth: 960,
                      }}
                    >
                      <div className="px-4 py-3 bg-white sticky left-0 z-[1]">
                        <div className="flex items-start gap-2">
                          <span className="text-black/85">{row.label}</span>

                          {row.tooltip && (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger
                                  aria-label={t('competitors.table.moreInfo')}
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
                            row.values?.[h.key] as CellValue,
                            t('competitors.values.extraFee')
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
                  {h.subtitle && (
                    <p className="mt-1 text-xs text-white/80 text-center">
                      {h.subtitle}
                    </p>
                  )}
                </div>

                <ul className="p-4 space-y-3">
                  {ROWS.filter((r) => isFeature(r)).map((row) => {
                    const val = row.values?.[h.key] as CellValue;
                    const isBool = typeof val === 'boolean';
                    const txt = !isBool ? formatValue(val) : null;
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
    </main>
  );
}

export default CompetitorComparison;
