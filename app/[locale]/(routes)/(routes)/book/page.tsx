'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type Kind = 'available' | 'unavailable';

type DefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Lundi ... 6 = Dimanche
  startTime: string;
  endTime: string;
};

type DayException = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  kind: Kind;
};

type WeeklyAgendaResponse = {
  weekStart: string;
  weekEnd: string;
  instructor: {
    id: string;
    name: string | null;
    role: string | null;
  };
  defaults: DefaultAvailability[];
  exceptions: DayException[];
};

type ServiceCategory = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

type ServicePricing = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: string;
  includes_transport: boolean;
};

type ServicesApiResponse = {
  instructorId: string;
  categories: ServiceCategory[];
  services: ServicePricing[];
};

type Interval = { start: number; end: number };

const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 60;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function isoToDateOnly(iso: string): Date {
  const base = iso.slice(0, 10);
  const [yStr, mStr, dStr] = base.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMondayISO(base?: string): string {
  const d = base ? isoToDateOnly(base) : new Date();
  const dow = d.getDay(); // 0..6 (0=dim)
  const isoDow = dow === 0 ? 7 : dow;
  const diff = isoDow - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return dateToISO(d);
}

function addDaysISO(iso: string, delta: number): string {
  const d = isoToDateOnly(iso);
  d.setDate(d.getDate() + delta);
  return dateToISO(d);
}

function formatDDMM(iso: string): string {
  const d = isoToDateOnly(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function mergeIntervals(ranges: Interval[]): Interval[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const result: Interval[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.start <= current.end) {
      current.end = Math.max(current.end, r.end);
    } else {
      result.push(current);
      current = { ...r };
    }
  }
  result.push(current);
  return result;
}

function subtractIntervals(base: Interval[], blocks: Interval[]): Interval[] {
  let res = [...base];
  for (const b of blocks) {
    const tmp: Interval[] = [];
    for (const r of res) {
      if (b.end <= r.start || b.start >= r.end) {
        tmp.push(r);
        continue;
      }
      if (b.start > r.start) {
        tmp.push({ start: r.start, end: b.start });
      }
      if (b.end < r.end) {
        tmp.push({ start: b.end, end: r.end });
      }
    }
    res = tmp;
  }
  return res;
}

/**
 * Calcule les créneaux disponibles finaux pour un jour :
 * - defaults (semaine type)
 * - + exceptions kind='available'
 * - - exceptions kind='unavailable'
 */
function buildAvailableSlotsForDay(
  defaultsForDay: DefaultAvailability[],
  exceptionsForDay: DayException[]
): { startTime: string; endTime: string }[] {
  const defaultIntervals: Interval[] = defaultsForDay.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  const extraAvail: Interval[] = exceptionsForDay
    .filter((e) => e.kind === 'available')
    .map((e) => ({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    }));

  const unavail: Interval[] = exceptionsForDay
    .filter((e) => e.kind === 'unavailable')
    .map((e) => ({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    }));

  let base = mergeIntervals([...defaultIntervals, ...extraAvail]);
  const withoutUnavail = subtractIntervals(base, unavail);
  const finalMerged = mergeIntervals(withoutUnavail);

  return finalMerged.map((r) => ({
    startTime: minutesToTime(r.start),
    endTime: minutesToTime(r.end),
  }));
}

function getBlockStyle(startTime: string, endTime: string) {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const offsetFromStart = startM - START_HOUR * 60;
  const duration = endM - startM;

  const top = (offsetFromStart / 60) * PIXELS_PER_HOUR;
  const height = (duration / 60) * PIXELS_PER_HOUR;

  return { top, height };
}

function getExceptionColor(kind: Kind) {
  if (kind === 'available') {
    return 'bg-emerald-100 border-emerald-400 text-emerald-900';
  }
  return 'bg-rose-100 border-rose-400 text-rose-900';
}

export default function BookPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const selectedServiceId = searchParams.get('serviceId');

  const [weekStart, setWeekStart] = useState<string>(() =>
    startOfWeekMondayISO()
  );
  const weekEnd = useMemo(() => addDaysISO(weekStart, 6), [weekStart]);

  const [data, setData] = useState<WeeklyAgendaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Infos sur le service sélectionné
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<{
    id: number;
    name: string;
    categoryName: string;
    durationMinutes: number | null;
  } | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3000);
  };

  // Charger l’agenda hebdo du moniteur
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchAgenda = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(
          `/api/me/instructor-weekly-agenda?weekStart=${encodeURIComponent(
            weekStart
          )}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json: WeeklyAgendaResponse = await res.json();
        setData(json);
        showNotice('Agenda chargé.');
      } catch (e: any) {
        console.error('Error fetching instructor agenda', e);
        setError(
          e?.message || "Impossible de récupérer l'agenda de votre moniteur."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [isLoaded, isSignedIn, weekStart]);

  // Charger les infos du service sélectionné (nom + catégorie)
  useEffect(() => {
    if (!selectedServiceId) {
      setSelectedService(null);
      setServiceError(null);
      return;
    }

    const numericId = Number(selectedServiceId);
    if (!Number.isFinite(numericId)) {
      setSelectedService(null);
      setServiceError('Service invalide dans l’URL.');
      return;
    }

    const loadService = async () => {
      try {
        setServiceLoading(true);
        setServiceError(null);
        setSelectedService(null);

        const res = await fetch('/api/me/instructor-services', {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || 'Impossible de récupérer la liste des services.'
          );
        }

        const data: ServicesApiResponse = await res.json();
        const service = (data.services || []).find((s) => s.id === numericId);

        if (!service) {
          setServiceError(
            "Le service sélectionné n'existe pas ou n'est pas disponible."
          );
          setSelectedService(null);
          return;
        }

        setSelectedService({
          id: service.id,
          name: service.name,
          categoryName: service.category_name,
          durationMinutes: service.duration_minutes,
        });
      } catch (e: any) {
        console.error('Error fetching selected service', e);
        setServiceError(
          e?.message || 'Impossible de récupérer le service sélectionné.'
        );
      } finally {
        setServiceLoading(false);
      }
    };

    loadService();
  }, [selectedServiceId]);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)),
    [weekStart]
  );

  const handlePrevWeek = () => {
    setWeekStart((prev) => addDaysISO(prev, -7));
  };
  const handleNextWeek = () => {
    setWeekStart((prev) => addDaysISO(prev, 7));
  };

  let content: React.ReactNode;

  if (!isLoaded) {
    content = (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement de votre session…
      </div>
    );
  } else if (!isSignedIn) {
    content = (
      <div className="p-6 text-sm text-muted-foreground">
        Vous devez être connecté pour voir les disponibilités de votre moniteur.
      </div>
    );
  } else {
    content = (
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Réserver un créneau
            </h1>
            <p className="text-muted-foreground mt-1">
              Voici les créneaux où votre moniteur est disponible cette semaine.
            </p>
            {data?.instructor && (
              <p className="text-sm text-muted-foreground mt-1">
                Moniteur :{' '}
                <span className="font-medium">
                  {data.instructor.name || 'Moniteur'}
                </span>
              </p>
            )}

            {/* Info service sélectionné */}
            {selectedServiceId ? (
              serviceLoading ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Chargement du service sélectionné…
                </p>
              ) : selectedService ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Service sélectionné :{' '}
                  <span className="font-medium">{selectedService.name}</span>{' '}
                  <span className="text-[11px] text-muted-foreground">
                    ({selectedService.categoryName}
                    {selectedService.durationMinutes != null
                      ? ` • ${selectedService.durationMinutes} min`
                      : ''}
                    )
                  </span>
                </p>
              ) : (
                <p className="text-xs text-amber-700 mt-1">
                  {serviceError ||
                    "Le service choisi n'a pas pu être chargé. Vous pouvez en sélectionner un autre."}{' '}
                  <a
                    href="/book/services"
                    className="underline underline-offset-2 hover:text-amber-800"
                  >
                    Choisir un autre service
                  </a>
                  .
                </p>
              )
            ) : (
              <p className="text-xs text-amber-700 mt-1">
                Aucun service sélectionné.{' '}
                <a
                  href="/book/services"
                  className="underline underline-offset-2 hover:text-amber-800"
                >
                  Choisir un service
                </a>{' '}
                avant de réserver un créneau.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
              ← Semaine précédente
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Semaine suivante →
            </Button>
          </div>
        </div>

        {notice && (
          <Alert>
            <AlertDescription className="text-sm">{notice}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Agenda hebdo */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle>Agenda de votre moniteur</CardTitle>
              <p className="text-sm text-muted-foreground">
                Semaine du{' '}
                <span className="font-medium">{formatDDMM(weekStart)}</span> au{' '}
                <span className="font-medium">{formatDDMM(weekEnd)}</span>.
              </p>
              <p className="text-xs text-muted-foreground">
                Les créneaux affichés correspondent aux disponibilités réelles
                de votre moniteur (les indisponibilités sont exclues).
              </p>
            </div>
          </CardHeader>

          <CardContent>
            {loading || !data ? (
              <div className="py-8 text-sm text-muted-foreground">
                Chargement des créneaux disponibles…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Header ligne jours */}
                  <div className="grid grid-cols-8">
                    <div className="p-2 border-b text-sm font-medium text-muted-foreground">
                      Heure
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
                      const defaultsForDay =
                        data.defaults.filter((a) => a.dayOfWeek === dayIndex) ??
                        [];
                      const exceptionsForDay =
                        data.exceptions.filter((e) => e.date === dateIso) ?? [];

                      const availableSlots = buildAvailableSlotsForDay(
                        defaultsForDay,
                        exceptionsForDay
                      );

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

                          {/* Créneaux disponibles finaux */}
                          {availableSlots.map((slot, idx) => {
                            const { top, height } = getBlockStyle(
                              slot.startTime,
                              slot.endTime
                            );

                            const colorClass = getExceptionColor('available');

                            return (
                              <div
                                key={`${dateIso}-${idx}-${slot.startTime}-${slot.endTime}`}
                                className={`absolute left-1 right-1 rounded-md border shadow-sm ${colorClass}`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  minHeight: '24px',
                                }}
                                title={`Disponible : ${slot.startTime}–${slot.endTime}`}
                              >
                                <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                                  <span className="text-[10px] leading-tight truncate">
                                    {slot.startTime} – {slot.endTime}
                                  </span>
                                  <span className="text-[8px] leading-tight uppercase opacity-80 mt-0.5">
                                    Disponible
                                  </span>
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
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div className="min-h-screen bg-background p-6">{content}</div>;
}
