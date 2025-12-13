// app/(...)/LastWeekAgenda.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08 → 19
const START_HOUR = 8;
const PIXELS_PER_HOUR = 80;

// Palette de classes Tailwind {bg + border + text} plus contrastée
const PARTNER_PALETTE = [
  'bg-emerald-200 border-emerald-600 text-emerald-950',
  'bg-sky-200 border-sky-600 text-sky-950',
  'bg-violet-200 border-violet-600 text-violet-950',
  'bg-amber-200 border-amber-600 text-amber-950',
  'bg-rose-200 border-rose-600 text-rose-950',
  'bg-teal-200 border-teal-600 text-teal-950',
  'bg-indigo-200 border-indigo-600 text-indigo-950',
  'bg-lime-200 border-lime-600 text-lime-950',
  'bg-fuchsia-200 border-fuchsia-600 text-fuchsia-950',
  'bg-cyan-200 border-cyan-600 text-cyan-950',
  'bg-orange-200 border-orange-600 text-orange-950',
  'bg-blue-200 border-blue-600 text-blue-950',
];

type Role = 'student' | 'instructor' | 'admin';

type Slot = {
  startTime: string;
  endTime: string;
  studentId?: string | null;
  studentName?: string | null;
  instructorName?: string | null;

  serviceName?: string | null;
  servicePrice?: number | string | null;
  formattedAddress?: string | null;
};

type ApiDay =
  | { dayOfWeek: number; dayDate?: string | null; slots: Slot[] }
  | { dayOfWeek: number; dayDate?: string | null; slots: [] };

type NextSlot = {
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  counterpartName: string | null;
};

/** Trajet calculé entre deux créneaux pour un jour donné. */
type TravelSlot = {
  date: string;
  startTime: string;
  endTime: string;
  fromLabel: string | null;
  toLabel: string | null;
};

type ApiResponse = {
  weekShown: string;
  user: { id: string; name: string | null; role: Role };
  days: ApiDay[];
  hasDetailedSlots: boolean;
  nextSlots?: NextSlot[];

  // 🔶 map date ISO -> trajets calculés (présent pour instructor/admin uniquement)
  travelsByDate?: Record<string, TravelSlot[]>;
};

// ---------- Utils ----------

function formatServicePrice(
  price: number | string | null | undefined
): string | null {
  if (price === null || price === undefined) return null;
  const n = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(n)) return String(price);
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

// Hash déterministe pour indexer la palette
function hashStringToIndex(s: string, modulo: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

// Quel "partenaire" sert de base pour la couleur (id si possible, sinon nom)
function getSlotPartnerKey(slot: Slot, viewerRole?: Role) {
  if (viewerRole === 'instructor') {
    // Moniteur : couleur par élève
    return (slot.studentId ?? slot.studentName ?? 'UNKNOWN_STUDENT').trim();
  }
  if (viewerRole === 'student') {
    // Élève : couleur par moniteur
    return (slot.instructorName ?? 'UNKNOWN_INSTRUCTOR').trim();
  }
  // Admin / autres : on prend ce qu'on a
  return (
    slot.studentId ??
    slot.studentName ??
    slot.instructorName ??
    'UNKNOWN_PARTNER'
  ).trim();
}

function getSlotColorClass(slot: Slot, viewerRole?: Role) {
  const key = getSlotPartnerKey(slot, viewerRole);
  const idx = hashStringToIndex(key, PARTNER_PALETTE.length);
  return PARTNER_PALETTE[idx];
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function getBlockStyle(startTime: string, endTime: string) {
  const start = timeToMinutes(stripSeconds(startTime));
  const end = timeToMinutes(stripSeconds(endTime));
  const offset = start - START_HOUR * 60;
  const dur = Math.max(0, end - start);
  return {
    top: (offset / 60) * PIXELS_PER_HOUR,
    height: (dur / 60) * PIXELS_PER_HOUR,
  };
}

/** Supprime les secondes si présentes ("HH:MM:SS" -> "HH:MM"). */
function stripSeconds(t: string) {
  const parts = t.split(':');
  if (parts.length >= 2)
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  return t;
}

/** Parse "YYYY-MM-DD" sans décalage de fuseau (local). */
function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** Format court "dd/mm". */
function fmtDDMM(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/** Re-dump en "YYYY-MM-DD" pour comparaisons. */
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Lundi de la semaine d'une date donnée (en local). */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=dim,1=lun,...6=sam
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Ajoute delta jours à un ISO "YYYY-MM-DD". */
function addDaysToISO(iso: string, delta: number): string {
  const d = parseISODateLocal(iso);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

/** Détecte a minima qu'on a la bonne forme de payload. */
function looksLikeAgendaPayload(p: any): p is Partial<ApiResponse> {
  return !!p && typeof p === 'object' && Array.isArray(p.days) && !!p.weekShown;
}

/** Construit l'URL Google Maps pour un trajet, à partir des labels. */
function buildTravelMapsUrl(travel: TravelSlot): string | null {
  let origin: string | null = travel.fromLabel ?? null;
  let destination: string | null = travel.toLabel ?? null;

  if (!origin && !destination) return null;

  const params: string[] = ['api=1'];
  if (origin) {
    params.push(`origin=${encodeURIComponent(origin)}`);
  }
  if (destination) {
    params.push(`destination=${encodeURIComponent(destination)}`);
  }

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

// ---------- Composant ----------

export default function LastWeekAgenda({ userId }: { userId?: string }) {
  const router = useRouter();
  const t = useTranslations('myWeek');
  const locale = useLocale();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [currentWeekStartISO, setCurrentWeekStartISO] = useState<string | null>(
    () => {
      const monday = getMondayOfWeek(new Date());
      return toISO(monday);
    }
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (currentWeekStartISO) params.set('weekStart', currentWeekStartISO);

        const qs = params.toString();
        const res = await fetch(`/api/me/weeks${qs ? `?${qs}` : ''}`, {
          credentials: 'include',
        });

        const payload = await res
          .json()
          .catch(() => null as unknown as ApiResponse | null);

        if (!res.ok) {
          throw new Error(
            (payload as any)?.error ||
              (payload as any)?.detail ||
              `Erreur HTTP ${res.status}`
          );
        }

        if (!looksLikeAgendaPayload(payload)) {
          throw new Error(t('errors.unexpectedApiResponse'));
        }

        const json = payload as ApiResponse;
        setData(json);

        // On se cale sur le lundi renvoyé par l'API (au cas où).
        if (json.weekShown) {
          setCurrentWeekStartISO(json.weekShown);
        }
      } catch (e: any) {
        setErr(e?.message ?? t('errors.genericLoad'));
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, currentWeekStartISO, t]);

  const daysMap = useMemo(() => {
    const m = new Map<number, ApiDay>();
    data?.days?.forEach((d) => m.set(d.dayOfWeek, d));
    return m;
  }, [data]);

  /** Calcule pour chaque index 0..6 : la date effective et si c’est aujourd’hui. */
  const dayHeaders = useMemo(() => {
    const dayLabel = (i: number) => t(`days.${i}` as any);

    if (!data?.weekShown) {
      return DAYS.map((_, i) => ({
        label: dayLabel(i),
        dateLabel: '',
        iso: '',
        isToday: false,
      }));
    }

    const base = parseISODateLocal(data.weekShown); // lundi S affiché
    const today = new Date();
    const todayISO = toISO(today);

    return DAYS.map((_, i) => {
      const d = daysMap.get(i);
      const dt = d?.dayDate
        ? parseISODateLocal(d.dayDate)
        : new Date(base.getTime());
      if (!d?.dayDate) dt.setDate(base.getDate() + i);

      const iso = toISO(dt);
      return {
        label: dayLabel(i),
        dateLabel: fmtDDMM(dt),
        iso,
        isToday: iso === todayISO,
      };
    });
  }, [data?.weekShown, daysMap, t]);

  // En-tête lisible: "dd/mm → dd/mm"
  const headerRange = useMemo(() => {
    if (!data?.weekShown) return '';
    const start = parseISODateLocal(data.weekShown);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${fmtDDMM(start)} → ${fmtDDMM(end)}`;
  }, [data?.weekShown]);

  // Détermine pour chaque slot quel “nom” afficher (moniteur ou élève)
  const getCounterpartName = (slot: Slot) =>
    slot.studentName ?? slot.instructorName ?? null;

  const viewerRole: Role | undefined = data?.user.role;

  const partnerLegend = useMemo(() => {
    if (!data?.days) return [];
    const set = new Map<string, string>(); // label lisible -> class

    for (const d of data.days) {
      const slots = (d as any)?.slots ?? [];
      for (const s of slots as Slot[]) {
        const colorClass = getSlotColorClass(s, viewerRole);

        // Libellé humain pour la légende
        const label =
          viewerRole === 'instructor'
            ? s.studentName ?? t('legend.unknownStudent')
            : viewerRole === 'student'
            ? s.instructorName ?? t('legend.unknownInstructor')
            : s.studentName ?? s.instructorName ?? t('legend.unknownPartner');

        if (!set.has(label)) set.set(label, colorClass);
      }
    }

    return Array.from(set.entries()); // [ [label, class], ... ]
  }, [data?.days, viewerRole, t]);

  const upcoming = data?.nextSlots ?? [];
  const travelsByDate = data?.travelsByDate ?? {};

  const handlePrevWeek = () => {
    setCurrentWeekStartISO((prev) => {
      if (!prev) {
        const monday = getMondayOfWeek(new Date());
        return toISO(monday);
      }
      return addDaysToISO(prev, -7);
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStartISO((prev) => {
      if (!prev) {
        const monday = getMondayOfWeek(new Date());
        return toISO(monday);
      }
      return addDaysToISO(prev, 7);
    });
  };

  const showTravels = viewerRole && viewerRole !== 'student';

  // Locale JS pour les noms de jours courts
  const weekdayLocale =
    locale === 'fr' || locale.startsWith('fr') ? 'fr-FR' : 'en-US';

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium">
            {t('header.title')}{' '}
            {headerRange && (
              <span className="text-neutral-500">
                {t('header.range', { range: headerRange })}
              </span>
            )}
            {partnerLegend.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {partnerLegend.map(([name, klass]) => (
                  <div
                    key={name}
                    className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${klass}`}
                    title={name}
                  >
                    <span className="inline-block h-2 w-2 rounded-full border" />
                    <span className="truncate max-w-[160px]">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {data?.user && (
              <div className="text-sm">
                <span className="font-medium">
                  {data.user.name ?? data.user.id}
                </span>{' '}
                <span className="text-neutral-500">
                  (
                  {data.user.role === 'instructor'
                    ? t('roles.instructor')
                    : data.user.role === 'student'
                    ? t('roles.student')
                    : t('roles.admin')}
                  )
                </span>
              </div>
            )}

            {/* Navigation semaine */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="text-xs px-2 py-1 border rounded-md hover:bg-muted"
              >
                {t('buttons.prevWeek')}
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="text-xs px-2 py-1 border rounded-md hover:bg-muted"
              >
                {t('buttons.nextWeek')}
              </button>
            </div>
          </div>
        </div>

        {/* Section "Prochains cours réservés" (élève uniquement) */}
        {data?.user.role === 'student' && (
          <div className="mt-3 text-xs text-neutral-800">
            <div className="font-semibold mb-1">{t('upcoming.title')}</div>

            {upcoming.length === 0 ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-md border border-dashed bg-muted/50 px-3 py-2">
                <span>{t('upcoming.empty')}</span>
                <button
                  type="button"
                  onClick={() => router.push('/book/services')}
                  className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md border border-primary px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
                >
                  {t('upcoming.cta')}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {upcoming.map((s, idx) => {
                  const d = parseISODateLocal(s.date);
                  const dateLabel = fmtDDMM(d);
                  const weekday = d.toLocaleDateString(weekdayLocale, {
                    weekday: 'short',
                  });
                  return (
                    <div
                      key={`${s.date}-${s.startTime}-${idx}`}
                      className="inline-flex flex-col rounded-md border bg-muted px-2 py-1"
                    >
                      <span className="text-[11px] font-medium">
                        {weekday} {dateLabel}
                      </span>
                      <span className="text-[11px]">
                        {stripSeconds(s.startTime)} – {stripSeconds(s.endTime)}
                      </span>
                      {s.counterpartName && (
                        <span className="text-[11px] text-neutral-600">
                          {t('upcoming.withCounterpart', {
                            name: s.counterpartName,
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

        {err && (
          <div className="mt-2 text-xs text-red-600">
            {t('errors.load')}: {err}
          </div>
        )}
      </div>

      <div className="p-4 overflow-x-auto">
        {loading ? (
          <div className="text-sm text-neutral-500">{t('loading')}</div>
        ) : !data ? (
          <div className="text-sm text-neutral-500">{t('errors.noAgenda')}</div>
        ) : (
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-8 gap-0">
              <div className="font-medium text-sm text-muted-foreground p-2 border-b">
                {t('table.hourColumn')}
              </div>
              {dayHeaders.map((d) => (
                <div
                  key={d.label}
                  className={`font-medium text-sm text-center p-2 border-b border-r ${
                    d.isToday ? 'bg-green-50 text-green-900' : ''
                  }`}
                >
                  {d.label}
                  <span className="ml-1 text-xs text-neutral-500">
                    {d.dateLabel ? `• ${d.dateLabel}` : ''}
                  </span>
                  {d.isToday && (
                    <span className="ml-2 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium border bg-green-200 border-green-500 text-green-900">
                      {t('todayBadge')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-8 gap-0">
              {/* Hours column */}
              <div>
                {HOURS.map((hour) => (
                  <div
                    key={`hour-${hour}`}
                    className="text-sm text-muted-foreground p-2 border-r border-b"
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS.map((_, dayIndex) => {
                const d = daysMap.get(dayIndex);
                const slots = (d as any)?.slots ?? [];
                const isToday = dayHeaders[dayIndex]?.isToday;
                const isoDate = dayHeaders[dayIndex]?.iso;
                const travelsForDay: TravelSlot[] =
                  isoDate && travelsByDate[isoDate]
                    ? travelsByDate[isoDate]
                    : [];

                const isInstructorView = viewerRole === 'instructor';

                return (
                  <div
                    key={`day-${dayIndex}`}
                    className={`relative border-r ${
                      isToday ? 'bg-green-100/40 ring-1 ring-green-500' : ''
                    }`}
                  >
                    {/* background cells */}
                    {HOURS.map((hour) => (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="border-b"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* 🔶 Trajets : blocs orange, seulement pour roles ≠ student */}
                    {showTravels &&
                      isoDate &&
                      Array.isArray(travelsForDay) &&
                      travelsForDay.map((tTravel, i) => {
                        const { top, height } = getBlockStyle(
                          tTravel.startTime,
                          tTravel.endTime
                        );

                        const tooltipLines: string[] = [];
                        tooltipLines.push(
                          `${t('travel.tooltipTime', {
                            start: stripSeconds(tTravel.startTime),
                            end: stripSeconds(tTravel.endTime),
                          })}`
                        );
                        if (tTravel.fromLabel) {
                          tooltipLines.push(
                            `${t('travel.from')} ${tTravel.fromLabel}`
                          );
                        }
                        if (tTravel.toLabel) {
                          tooltipLines.push(
                            `${t('travel.to')} ${tTravel.toLabel}`
                          );
                        }

                        const tooltip = tooltipLines.join('\n');

                        const handleClickTravel = () => {
                          const url = buildTravelMapsUrl(tTravel);
                          if (!url) return;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        };

                        return (
                          <button
                            key={`travel-${isoDate}-${i}`}
                            type="button"
                            onClick={handleClickTravel}
                            title={tooltip}
                            className="absolute left-2 right-2 rounded-md border shadow-sm bg-amber-100/80 border-amber-300 cursor-pointer hover:bg-amber-200/90 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            style={{
                              top,
                              height,
                              minHeight: '20px',
                              zIndex: 5,
                            }}
                          >
                            <div className="flex h-full flex-col items-start justify-center px-1 py-0.5 gap-0.5">
                              <span className="text-[9px] leading-tight font-mono truncate">
                                {stripSeconds(tTravel.startTime)} –{' '}
                                {stripSeconds(tTravel.endTime)}
                              </span>
                              <span className="text-[8px] leading-tight uppercase tracking-wide opacity-80 truncate">
                                {t('travel.label')}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                    {/* Créneaux réservés */}
                    {Array.isArray(slots) &&
                      slots.length > 0 &&
                      slots.map((s: Slot, i: number) => {
                        const { top, height } = getBlockStyle(
                          s.startTime,
                          s.endTime
                        );
                        const cc = getSlotColorClass(s, viewerRole);

                        const start = stripSeconds(s.startTime);
                        const end = stripSeconds(s.endTime);
                        const counterpart = getCounterpartName(s);

                        const labelCounterpart =
                          viewerRole === 'student'
                            ? t('counterpart.instructor')
                            : viewerRole === 'instructor'
                            ? t('counterpart.student')
                            : t('counterpart.generic');

                        const priceLabel =
                          isInstructorView && s.servicePrice != null
                            ? formatServicePrice(s.servicePrice)
                            : null;

                        const tooltipLines: string[] = [];
                        tooltipLines.push(`${start}–${end}`);

                        if (counterpart) {
                          tooltipLines.push(
                            `${labelCounterpart} : ${counterpart}`
                          );
                        }

                        if (s.serviceName) {
                          const base = `${t('slot.serviceLabel')} ${
                            s.serviceName
                          }`;
                          tooltipLines.push(
                            priceLabel ? `${base} (${priceLabel})` : base
                          );
                        } else if (priceLabel) {
                          tooltipLines.push(
                            `${t('slot.priceLabel')} ${priceLabel}`
                          );
                        }

                        if (s.formattedAddress) {
                          tooltipLines.push(
                            `${t('slot.addressLabel')} ${s.formattedAddress}`
                          );
                        }

                        const tooltip = tooltipLines.join('\n');

                        // Contenu multi-ligne dans le bloc
                        const contentLines: React.ReactNode[] = [];

                        contentLines.push(
                          <span
                            key="time"
                            className="text-[9px] leading-tight truncate font-mono"
                          >
                            {start} – {end}
                          </span>
                        );

                        if (counterpart) {
                          contentLines.push(
                            <span
                              key="name"
                              className="text-[10px] leading-tight font-medium truncate"
                            >
                              {counterpart}
                            </span>
                          );
                        }

                        if (s.serviceName) {
                          contentLines.push(
                            <span
                              key="service"
                              className="text-[8px] leading-tight opacity-85 truncate"
                            >
                              {s.serviceName}
                            </span>
                          );
                        }

                        if (priceLabel) {
                          contentLines.push(
                            <span
                              key="price"
                              className="text-[9px] leading-tight opacity-85 truncate"
                            >
                              {priceLabel}
                            </span>
                          );
                        }

                        const APPROX_LINE_HEIGHT = 11; // px
                        const VERTICAL_PADDING = 4; // px
                        const maxLinesRaw = Math.floor(
                          (height - VERTICAL_PADDING) / APPROX_LINE_HEIGHT
                        );
                        const maxLines =
                          maxLinesRaw < 1
                            ? 1
                            : Math.min(maxLinesRaw, contentLines.length);

                        return (
                          <div
                            key={`${dayIndex}-${i}`}
                            className={`absolute left-1 right-1 text-xs rounded-md border ${cc}`}
                            style={{
                              top,
                              height,
                              minHeight: '24px',
                              zIndex: 10,
                            }}
                            title={tooltip}
                          >
                            <div className="flex h-full flex-col items-start justify-center px-1 py-0.5 gap-0.5">
                              {contentLines.slice(0, maxLines)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
