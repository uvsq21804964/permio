'use client';

import { Check, Copy, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { trackButtonClick } from '@/lib/client/button-tracking';
import {
  NextSlot,
  Role,
} from '@/components/schedule/last-week-agenda-shared';
import {
  formatShortDate,
  formatTimeForLocale,
  isFrenchLocale,
  parseISODateLocal,
} from '@/lib/client/utils/schedule-display';

type TranslationFn = (key: string, values?: Record<string, unknown>) => string;

type LastWeekAgendaHeaderProps = {
  copied: boolean;
  error: string | null;
  headerRange: string;
  joinCode: string | null;
  joinUrl: string;
  locale: string;
  onCopyJoinCode: () => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
  onOpenBooking: () => void;
  onOpenServices: () => void;
  onPrevWeek: () => void;
  partnerLegend: Array<[string, string]>;
  servicesCount: number | null;
  servicesErr: string | null;
  servicesLoading: boolean;
  showNoServicesModal: boolean;
  t: TranslationFn;
  upcoming: NextSlot[];
  user: { id: string; name: string | null; role: Role } | null | undefined;
};

export function LastWeekAgendaHeader({
  copied,
  error,
  headerRange,
  joinCode,
  joinUrl,
  locale,
  onCopyJoinCode,
  onCurrentWeek,
  onNextWeek,
  onOpenBooking,
  onOpenServices,
  onPrevWeek,
  partnerLegend,
  servicesCount,
  servicesErr,
  servicesLoading,
  showNoServicesModal,
  t,
  upcoming,
  user,
}: LastWeekAgendaHeaderProps) {
  const isFrench = isFrenchLocale(locale);
  const weekdayLocale = isFrench ? 'fr-FR' : 'en-US';
  const currentWeekLabel = isFrench ? 'Cette semaine' : 'This week';

  return (
    <>
      {showNoServicesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
            <div className="text-base font-semibold text-black">
              {isFrench
                ? 'Ajoutez vos services pour obtenir votre code'
                : 'Add your services to get your code'}
            </div>
            <p className="mt-2 text-sm text-black/70">
              {isFrench
                ? "Vous n'avez aucun service enregistré. Pour générer votre code d'association (client <-> éducateur), vous devez d'abord renseigner vos services."
                : "You don't have any services yet. To generate your association code (client <-> trainer), you must first add your services."}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  trackButtonClick({
                    buttonKey: 'agenda_no_services_open_services',
                    buttonLabel: isFrench ? 'Aller a mes services' : 'Go to my services',
                    buttonContext: 'agenda_no_services_modal',
                    locale,
                    metadata: { role: user?.role ?? null },
                  });
                  onOpenServices();
                }}
                className="rounded-xl bg-gradient-to-r from-primary to-[#d400ff] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                {isFrench ? 'Aller à mes services' : 'Go to my services'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium">
            {t('header.title')}{' '}
            {headerRange && (
              <span className="text-neutral-500">
                {t('header.range', { range: headerRange })}
              </span>
            )}

            {user?.role === 'instructor' && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs">
                    <span className="font-medium">
                      {isFrench ? 'Services' : 'Services'} :
                    </span>
                    <span>
                      {servicesLoading
                        ? isFrench
                          ? 'Chargement...'
                          : 'Loading...'
                        : servicesCount == null
                          ? '—'
                          : servicesCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      trackButtonClick({
                        buttonKey: 'agenda_manage_services',
                        buttonLabel: isFrench ? 'Gerer mes services' : 'Manage my services',
                        buttonContext: 'agenda_header',
                        locale,
                        metadata: {
                          role: user?.role ?? null,
                          servicesCount: servicesCount ?? null,
                        },
                      });
                      onOpenServices();
                    }}
                    className="rounded-md border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/5"
                  >
                    {isFrench ? 'Gérer mes services' : 'Manage my services'}
                  </button>

                  {servicesErr && (
                    <span className="text-xs text-amber-700">
                      {isFrench
                        ? `Info services indisponible (${servicesErr})`
                        : `Services info unavailable (${servicesErr})`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-black/60">
                  <span className="font-medium">
                    {isFrench ? "URL d'association" : 'Association URL'}
                  </span>

                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger
                        aria-label={isFrench ? "Plus d'infos" : 'More info'}
                        className="inline-flex items-center"
                      >
                        <Info className="h-4 w-4" style={{ color: '#8920d1' }} />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[320px] border border-[#d400ff]/40 bg-white text-xs text-black shadow-lg">
                        {isFrench
                          ? 'Affiche ce code sur ton site web personnel. Les clients devront le saisir pour te trouver et réserver.'
                          : 'Display this URL on your personal website. Clients can open it to find you and book.'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {servicesCount != null && servicesCount > 0 && joinCode ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex max-w-[320px] items-center rounded-full border border-black/15 bg-white/70 px-2 py-0.5 font-mono text-[11px] text-black">
                        <span className="truncate">{joinUrl}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          trackButtonClick({
                            buttonKey: 'agenda_copy_join_code',
                            buttonLabel: isFrench ? 'Copier URL' : 'Copy URL',
                            buttonContext: 'agenda_header',
                            locale,
                            metadata: {
                              role: user?.role ?? null,
                              hasJoinCode: Boolean(joinCode),
                            },
                          });
                          onCopyJoinCode();
                        }}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-muted"
                        title={isFrench ? "Copier l'URL" : 'Copy URL'}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            {isFrench ? 'Copié' : 'Copied'}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            {isFrench ? 'Copier URL' : 'Copy URL'}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-black/50">
                      {isFrench
                        ? "Ajoutez au moins un service pour afficher l'URL."
                        : 'Add at least one service to display the URL.'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {partnerLegend.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {partnerLegend.map(([name, colorClass]) => (
                  <div
                    key={name}
                    className={`inline-flex max-w-[220px] items-center gap-2 rounded-md border px-2 py-1 text-xs ${colorClass}`}
                    title={name}
                  >
                    <span className="inline-block h-2 w-2 rounded-full border" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {user && (
              <div className="text-sm">
                <span className="font-medium">{user.name ?? user.id}</span>{' '}
                <span className="text-neutral-500">
                  (
                  {user.role === 'instructor'
                    ? t('roles.instructor')
                    : user.role === 'student'
                      ? t('roles.student')
                      : t('roles.admin')}
                  )
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPrevWeek}
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              >
                {t('buttons.prevWeek')}
              </button>
              <button
                type="button"
                onClick={onCurrentWeek}
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              >
                {currentWeekLabel}
              </button>
              <button
                type="button"
                onClick={onNextWeek}
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              >
                {t('buttons.nextWeek')}
              </button>
            </div>
          </div>
        </div>

        {user?.role === 'student' && (
          <div className="mt-3 text-xs text-neutral-800">
            <div className="mb-1 font-semibold">{t('upcoming.title')}</div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col gap-1 rounded-md border border-dashed bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{t('upcoming.empty')}</span>
                <button
                  type="button"
                  onClick={() => {
                    trackButtonClick({
                      buttonKey: 'agenda_upcoming_empty_open_booking',
                      buttonLabel: t('upcoming.cta'),
                      buttonContext: 'agenda_header',
                      locale,
                      metadata: { role: user?.role ?? null },
                    });
                    onOpenBooking();
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-md border border-primary px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5 sm:mt-0"
                >
                  {t('upcoming.cta')}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {upcoming.map((slot, index) => {
                  const date = parseISODateLocal(slot.date);
                  const weekday = date.toLocaleDateString(weekdayLocale, {
                    weekday: 'short',
                  });

                  return (
                    <div
                      key={`${slot.date}-${slot.startTime}-${index}`}
                      className="inline-flex flex-col rounded-md border bg-muted px-2 py-1"
                    >
                      <span className="text-[11px] font-medium">{weekday}</span>
                      <span className="text-[11px] text-neutral-600">
                        {formatShortDate(date, locale)}
                      </span>
                      <span className="text-[11px]">
                        {formatTimeForLocale(slot.startTime, locale)} -{' '}
                        {formatTimeForLocale(slot.endTime, locale)}
                      </span>
                      {slot.counterpartName && (
                        <span className="text-[11px] text-neutral-600">
                          {t('upcoming.withCounterpart', {
                            name: slot.counterpartName,
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-2 text-xs text-red-600">
            {t('errors.load')}: {error}
          </div>
        )}
      </div>
    </>
  );
}
