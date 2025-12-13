'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type {
  DayAvailability,
  DefaultAvailability,
  Slot,
  Travel,
} from '@/types/availability';

import {
  HOURS,
  PIXELS_PER_HOUR,
  DAY_LABELS_SHORT,
  addDaysISO,
  formatDDMM,
  todayWeekStartISO,
  getBlockStyle,
  getDayOverrideColor,
  getDefaultBlockColor,
  getSlotBlockColor,
} from '@/lib/availability-utils';

function formatServicePrice(
  price: number | string | null | undefined
): string | null {
  if (price === null || price === undefined) return null;
  const n = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(n)) return String(price);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

function buildGoogleMapsUrl(travel: Travel): string | null {
  // Origine = dogsitter
  let origin: string | null = null;
  if (travel.dogsitter_lat != null && travel.dogsitter_lng != null) {
    origin = `${travel.dogsitter_lat},${travel.dogsitter_lng}`;
  } else if (travel.dogsitter_formatted_address) {
    origin = travel.dogsitter_formatted_address;
  }

  // Destination = client
  let destination: string | null = null;
  if (travel.client_lat != null && travel.client_lng != null) {
    destination = `${travel.client_lat},${travel.client_lng}`;
  } else if (travel.client_formatted_address) {
    destination = travel.client_formatted_address;
  }

  if (!origin && !destination) {
    return null;
  }

  const params: string[] = ['api=1'];
  if (origin) {
    params.push(`origin=${encodeURIComponent(origin)}`);
  }
  if (destination) {
    params.push(`destination=${encodeURIComponent(destination)}`);
  }

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

export function WeeklyGlobalAgenda({ meRole }: { meRole: string | null }) {
  const t = useTranslations('weeklyAgenda');
  const { user, isLoaded: isUserLoaded } = useUser();
  const currentUserId = user?.id ?? null;

  const [weekStart, setWeekStart] = useState<string>(() => todayWeekStartISO());

  const [entriesByDate, setEntriesByDate] = useState<
    Record<string, DayAvailability[]>
  >({});
  const [defaultAvailabilities, setDefaultAvailabilities] = useState<
    DefaultAvailability[]
  >([]);

  // Slots réservés groupés par date (YYYY-MM-DD)
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});

  // Travels groupés par date (YYYY-MM-DD)
  const [travelsByDate, setTravelsByDate] = useState<Record<string, Travel[]>>(
    {}
  );

  const [loadingWeek, setLoadingWeek] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 💰 Total gagné sur la semaine courante (côté dogsitter uniquement)
  const totalWeeklyEarnings = useMemo(() => {
    if (!currentUserId) return 0;

    let sum = 0;

    for (const dateKey of Object.keys(slotsByDate)) {
      const list = slotsByDate[dateKey] || [];
      for (const s of list) {
        if (s.dogsitterUserId !== currentUserId) continue;

        const rawPrice = s.servicePrice;
        let numericPrice: number | null = null;

        if (typeof rawPrice === 'number') {
          numericPrice = Number.isFinite(rawPrice) ? rawPrice : null;
        } else if (typeof rawPrice === 'string') {
          const n = Number(rawPrice);
          numericPrice = Number.isFinite(n) ? n : null;
        }

        if (numericPrice != null) {
          sum += numericPrice;
        }
      }
    }

    return sum;
  }, [slotsByDate, currentUserId]);

  // 🐶 L'utilisateur est-il dogsitter sur au moins un créneau de la semaine ?
  const isDogsitterForWeek = useMemo(() => {
    if (!currentUserId) return false;

    for (const dateKey of Object.keys(slotsByDate)) {
      const list = slotsByDate[dateKey] || [];
      if (list.some((s) => s.dogsitterUserId === currentUserId)) {
        return true;
      }
    }
    return false;
  }, [slotsByDate, currentUserId]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3000);
  };

  // Charger les dispos par défaut une fois
  useEffect(() => {
    const fetchDefaults = async () => {
      setLoadingDefaults(true);
      try {
        const res = await fetch('/api/availabilities', {
          credentials: 'include',
        });
        if (!res.ok) {
          console.error(
            'Erreur GET /api/availabilities',
            res.status,
            await res.text().catch(() => '')
          );
          return;
        }
        const json = await res.json();
        const list: DefaultAvailability[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.availabilities)
          ? json.availabilities
          : Array.isArray(json?.data)
          ? json.data
          : [];

        setDefaultAvailabilities(list);
      } catch (e) {
        console.error('Error fetching default availabilities', e);
      } finally {
        setLoadingDefaults(false);
      }
    };

    fetchDefaults();
  }, []);

  // 🔥 Charger exceptions + slots + travels, filtrés par currentUserId
  const fetchWeek = async (weekStartISO: string, userId: string | null) => {
    if (!userId) {
      setEntriesByDate({});
      setSlotsByDate({});
      setTravelsByDate({});
      return;
    }

    setLoadingWeek(true);
    setError(null);

    try {
      const dates = Array.from({ length: 7 }, (_, i) =>
        addDaysISO(weekStartISO, i)
      );
      const weekEndISO = addDaysISO(weekStartISO, 6);

      // 1) Exceptions jour par jour
      const weekExceptionsPromise = Promise.all(
        dates.map(async (dateIso) => {
          const res = await fetch(
            `/api/availabilities/day?date=${encodeURIComponent(dateIso)}`,
            { credentials: 'include' }
          );
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} pour le ${dateIso}`);
          }
          const data: DayAvailability[] = await res.json();
          return [dateIso, data] as const;
        })
      );

      // 2) Slots réservés
      const slotsPromise = (async () => {
        try {
          const slotRes = await fetch(
            `/api/slots/week?from=${encodeURIComponent(
              weekStartISO
            )}&to=${encodeURIComponent(weekEndISO)}`,
            { credentials: 'include' }
          );

          if (!slotRes.ok) {
            console.error(
              'Erreur GET /api/slots/week',
              slotRes.status,
              await slotRes.text().catch(() => '')
            );
            return {} as Record<string, Slot[]>;
          }

          const jsonSlots = await slotRes.json();
          const slots: Slot[] = Array.isArray(jsonSlots)
            ? jsonSlots
            : Array.isArray(jsonSlots?.data)
            ? jsonSlots.data
            : [];

          const visibleSlots = slots.filter((s) => {
            const clientForSlot = s.clientUserId;
            return clientForSlot === userId || s.dogsitterUserId === userId;
          });

          const grouped: Record<string, Slot[]> = {};
          for (const s of visibleSlots) {
            const key = (s.date || '').slice(0, 10);
            if (!key) continue;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(s);
          }

          return grouped;
        } catch (e) {
          console.error('Error fetching slots for week', e);
          return {} as Record<string, Slot[]>;
        }
      })();

      // 3) Trajets
      const travelsPromise = (async () => {
        try {
          // 🎓 student → pas de trajets
          if (meRole === 'student') {
            return {} as Record<string, Travel[]>;
          }

          const travelRes = await fetch(
            `/api/travels/week?from=${encodeURIComponent(
              weekStartISO
            )}&to=${encodeURIComponent(weekEndISO)}`,
            { credentials: 'include' }
          );

          if (!travelRes.ok) {
            console.error(
              'Erreur GET /api/travels/week',
              travelRes.status,
              await travelRes.text().catch(() => '')
            );
            return {} as Record<string, Travel[]>;
          }

          const jsonTravels = await travelRes.json();
          const travels: Travel[] = Array.isArray(jsonTravels)
            ? jsonTravels
            : Array.isArray(jsonTravels?.data)
            ? jsonTravels.data
            : [];

          const visibleTravels = travels.filter((t) => {
            return t.dogsitterUserId === userId || t.clientUserId === userId;
          });

          const grouped: Record<string, Travel[]> = {};
          for (const t of visibleTravels) {
            const rawDate = t.date;
            let key = '';

            if (typeof rawDate === 'string') {
              key = rawDate.slice(0, 10);
            } else if (rawDate instanceof Date) {
              const year = rawDate.getFullYear();
              const month = String(rawDate.getMonth() + 1).padStart(2, '0');
              const day = String(rawDate.getDate()).padStart(2, '0');
              key = `${year}-${month}-${day}`;
            }

            if (!key) continue;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
          }

          return grouped;
        } catch (e) {
          console.error('Error fetching travels for week', e);
          return {} as Record<string, Travel[]>;
        }
      })();

      const [results, groupedSlots, groupedTravels] = await Promise.all([
        weekExceptionsPromise,
        slotsPromise,
        travelsPromise,
      ]);

      const map: Record<string, DayAvailability[]> = {};
      for (const [d, entries] of results) {
        map[d] = entries;
      }

      setEntriesByDate(map);
      setSlotsByDate(groupedSlots);
      setTravelsByDate(groupedTravels);
    } catch (e) {
      console.error('Error fetching weekly agenda', e);
      setError(t('error_load_week'));
    } finally {
      setLoadingWeek(false);
    }
  };

  // Recharger la semaine quand l'utilisateur ou la semaine change
  useEffect(() => {
    if (!isUserLoaded) return;
    fetchWeek(weekStart, currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, currentUserId, isUserLoaded]);

  const handlePrevWeek = () => {
    setWeekStart((prev) => addDaysISO(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => addDaysISO(prev, 7));
  };

  const isLoading = loadingWeek || loadingDefaults || !isUserLoaded;

  const weekEndISO = addDaysISO(weekStart, 6);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDaysISO(weekStart, i)
  );

  return (
    <Card className="relative">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t('header_title')}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('header_period', {
              from: formatDDMM(weekStart),
              to: formatDDMM(weekEndISO),
            })}
            <br />
            {isDogsitterForWeek ? (
              <span className="text-xs text-muted-foreground">
                {t('legend_dogsitter')}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t('legend_default')}
              </span>
            )}
          </p>

          {isDogsitterForWeek && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('earnings_label_prefix')}{' '}
              <span className="font-semibold">
                {formatServicePrice(totalWeeklyEarnings) ?? t('earnings_none')}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            {t('nav_prev_week')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            {t('nav_next_week')}
          </Button>
        </div>
      </CardHeader>

      {notice && (
        <div className="px-6">
          <Alert className="mb-3">
            <AlertDescription className="text-sm">{notice}</AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="px-6">
          <Alert variant="destructive" className="mb-3">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <CardContent
        className={
          isLoading
            ? 'pointer-events-none opacity-40 transition-opacity'
            : 'transition-opacity'
        }
      >
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* En-têtes */}
            <div className="grid grid-cols-8">
              <div className="p-2 border-b text-sm font-medium text-muted-foreground">
                {t('column_hour')}
              </div>
              {weekDates.map((dateIso, idx) => (
                <div
                  key={dateIso}
                  className="p-2 border-b border-l text-center text-xs md:text-sm font-medium"
                >
                  <div>{DAY_LABELS_SHORT[idx]}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDDMM(dateIso)}
                  </div>
                </div>
              ))}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-8">
              {/* Colonne heures */}
              <div className="border-r">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b text-xs md:text-sm text-muted-foreground px-2 flex items-start"
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Colonnes jours */}
              {weekDates.map((dateIso, dayIndex) => {
                const entries = entriesByDate[dateIso] || [];
                const defaultsForDay = defaultAvailabilities.filter(
                  (a) => a.dayOfWeek === dayIndex
                );
                const slotsForDay = slotsByDate[dateIso] || [];
                const travelsForDay = travelsByDate[dateIso] || [];

                return (
                  <div
                    key={dateIso}
                    className="relative border-r last:border-r-0"
                  >
                    {/* Fond par heure */}
                    {HOURS.map((h) => (
                      <div
                        key={`${dateIso}-${h}`}
                        className="border-b bg-background/50"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* Dispos par défaut */}
                    {defaultsForDay.map((a) => {
                      const { top, height } = getBlockStyle(
                        a.startTime,
                        a.endTime
                      );
                      const colorClass = getDefaultBlockColor();

                      return (
                        <div
                          key={`default-${a.id}-${dateIso}`}
                          className={`absolute left-1 right-1 rounded-md border shadow-sm ${colorClass}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '22px',
                            opacity: 0.85,
                          }}
                          title={t('default_block_title', {
                            start: a.startTime,
                            end: a.endTime,
                          })}
                        >
                          <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                            <span className="text-[10px] leading-tight truncate">
                              {a.startTime} – {a.endTime}
                            </span>
                            <span className="text-[8px] leading-tight uppercase opacity-70 mt-0.5">
                              {t('default_block_label')}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Exceptions (dispo/indispo ponctuelles) */}
                    {entries.map((entry) => {
                      const { top, height } = getBlockStyle(
                        entry.startTime,
                        entry.endTime
                      );
                      const colorClass = getDayOverrideColor(entry.kind);

                      const label =
                        entry.kind === 'available'
                          ? t('override_block_label_available')
                          : t('override_block_label_unavailable');

                      return (
                        <div
                          key={entry.id}
                          className={`absolute left-1 right-1 rounded-md border shadow-sm ${colorClass}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '24px',
                          }}
                          title={`${entry.startTime}–${entry.endTime}`}
                        >
                          <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                            <span className="text-[10px] leading-tight truncate">
                              {entry.startTime} – {entry.endTime}
                            </span>
                            <span className="text-[8px] leading-tight uppercase opacity-80 mt-0.5">
                              {label}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Trajets (cachés si student) */}
                    {travelsForDay.map((travel) => {
                      const { top, height } = getBlockStyle(
                        travel.startTime,
                        travel.endTime
                      );

                      const tooltipLines: string[] = [];
                      tooltipLines.push(
                        t('travel_tooltip_time', {
                          start: travel.startTime,
                          end: travel.endTime,
                        })
                      );
                      if (travel.client_formatted_address) {
                        tooltipLines.push(
                          t('travel_tooltip_destination', {
                            address: travel.client_formatted_address,
                          })
                        );
                      }
                      if (travel.dogsitter_formatted_address) {
                        tooltipLines.push(
                          t('travel_tooltip_origin', {
                            address: travel.dogsitter_formatted_address,
                          })
                        );
                      }
                      const tooltip = tooltipLines.join('\n');

                      const handleClickTravel = () => {
                        const url = buildGoogleMapsUrl(travel);
                        if (!url) {
                          showNotice(t('notice_missing_address'));
                          return;
                        }
                        window.open(url, '_blank', 'noopener,noreferrer');
                      };

                      return (
                        <button
                          key={`travel-${travel.id}`}
                          type="button"
                          onClick={handleClickTravel}
                          title={tooltip}
                          className="absolute left-2 right-2 rounded-md border shadow-sm bg-amber-100/80 border-amber-300
                 cursor-pointer hover:bg-amber-200/90 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '20px',
                            zIndex: 5,
                          }}
                        >
                          <div className="flex h-full flex-col items-start justify-center px-1 py-0.5 gap-0.5">
                            <span className="text-[9px] leading-tight font-mono truncate">
                              {travel.startTime} – {travel.endTime}
                            </span>
                            <span className="text-[8px] leading-tight uppercase tracking-wide opacity-80 truncate">
                              {t('travel_label')}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Créneaux réservés */}
                    {slotsForDay.map((slot) => {
                      const { top, height } = getBlockStyle(
                        slot.startTime,
                        slot.endTime
                      );
                      const colorClass = getSlotBlockColor();

                      const clientForSlot = slot.clientUserId;
                      const isDogsitter =
                        currentUserId === slot.dogsitterUserId;
                      const isClient = currentUserId === clientForSlot;

                      const fallbackName = isDogsitter
                        ? t('slot_client_unknown')
                        : t('slot_instructor_unknown');

                      const mainName =
                        (isDogsitter ? slot.clientName : slot.dogsitterName) ||
                        fallbackName;

                      const mainLabel = isDogsitter
                        ? t('slot_main_label_client')
                        : t('slot_main_label_instructor');

                      const tooltipLines: string[] = [];
                      tooltipLines.push(
                        t('slot_tooltip_time', {
                          start: slot.startTime,
                          end: slot.endTime,
                        })
                      );
                      tooltipLines.push(
                        t('slot_tooltip_main', {
                          label: mainLabel,
                          name: mainName,
                        })
                      );

                      if (isDogsitter && slot.dogsitterName) {
                        tooltipLines.push(
                          t('slot_tooltip_you', { name: slot.dogsitterName })
                        );
                      } else if (isClient && slot.clientName) {
                        tooltipLines.push(
                          t('slot_tooltip_client', { name: slot.clientName })
                        );
                      }

                      const priceLabel = isDogsitter
                        ? formatServicePrice(slot.servicePrice)
                        : null;

                      if (slot.serviceName) {
                        if (priceLabel) {
                          tooltipLines.push(
                            t('slot_tooltip_service_with_price', {
                              service: slot.serviceName,
                              price: priceLabel,
                            })
                          );
                        } else {
                          tooltipLines.push(
                            t('slot_tooltip_service', {
                              service: slot.serviceName,
                            })
                          );
                        }
                      } else if (priceLabel) {
                        tooltipLines.push(
                          t('slot_tooltip_price', { price: priceLabel })
                        );
                      }

                      if (slot.formatted_address) {
                        tooltipLines.push(
                          t('slot_tooltip_address', {
                            address: slot.formatted_address,
                          })
                        );
                      }

                      const tooltip = tooltipLines.join('\n');

                      const contentLines: React.ReactNode[] = [];

                      contentLines.push(
                        <span
                          key="time"
                          className="text-[9px] leading-tight truncate font-mono"
                        >
                          {slot.startTime} – {slot.endTime}
                        </span>
                      );

                      contentLines.push(
                        <span
                          key="name"
                          className="text-[10px] leading-tight font-medium truncate"
                        >
                          {mainName}
                        </span>
                      );

                      if (slot.serviceName) {
                        contentLines.push(
                          <span
                            key="service"
                            className="text-[8px] leading-tight opacity-85 truncate"
                          >
                            {slot.serviceName}
                          </span>
                        );
                      }

                      if (isDogsitter && slot.servicePrice != null) {
                        contentLines.push(
                          <span
                            key="price"
                            className="text-[10px] leading-tight opacity-85 truncate"
                          >
                            {formatServicePrice(slot.servicePrice)}
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
                          key={`slot-${slot.id}`}
                          className={`absolute left-1 right-1 rounded-md border shadow-sm ${colorClass}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '26px',
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
        </div>
      </CardContent>

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="pointer-events-none flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t('loading_overlay')}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
