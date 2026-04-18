'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

import type { DayAvailability, Kind } from '@/types/availability';
import { todayISO } from '@/lib/availability-utils';

const START_HOUR = 5;
const END_HOUR = 23;
const MIN_TIME_MINUTES = START_HOUR * 60;
const MAX_TIME_MINUTES = END_HOUR * 60;
const STEP_MINUTES = 5;

type Meridiem = 'AM' | 'PM';

function isFrLocale(locale: string) {
  return locale === 'fr' || locale.startsWith('fr');
}

/** Date courte selon langue (FR dd/mm, EN mm/dd) */
function formatShortDateFromISO(iso: string, locale: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(y || 2000, (m || 1) - 1, d || 1, 0, 0, 0, 0);

  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');

  return isFrLocale(locale) ? `${dd}/${mm}` : `${mm}/${dd}`;
}

/** Heure selon langue (FR 08:30, EN 8:30 AM) */
function formatTimeForLocale(t: string, locale: string): string {
  const [hh, mm] = t.split(':').map(Number);
  const d = new Date(2000, 0, 1, hh || 0, mm || 0, 0, 0);

  const intlLocale = isFrLocale(locale) ? 'fr-FR' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !isFrLocale(locale),
  }).format(d);
}

const minutesToTime = (m: number) => {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function minutesToParts(mins: number) {
  const hh24 = Math.floor(mins / 60);
  const mm = mins % 60;

  const ampm: Meridiem = hh24 < 12 ? 'AM' : 'PM';
  const hh12 = ((hh24 + 11) % 12) + 1;

  return { hh24, mm, hh12, ampm };
}

function partsToMinutes(hh12: number, mm: number, ampm: Meridiem) {
  const h = hh12 % 12;
  const hh24 = ampm === 'AM' ? h : h + 12;
  return hh24 * 60 + mm;
}

function nearestAllowed(target: number, allowed: number[]) {
  let best = allowed[0] ?? target;
  let bestDiff = Math.abs(best - target);
  for (const v of allowed) {
    const d = Math.abs(v - target);
    if (d < bestDiff) {
      best = v;
      bestDiff = d;
    }
  }
  return best;
}

/**
 * Time selector:
 * - FR: HH(05..23) + MM(00/05..55)
 * - EN: HH(1..12) + MM(00/05..55) + AM/PM
 * value stored as "HH:MM" 24h
 */
function TimeSelect5mLocale({
  id,
  locale,
  value,
  onChange,
  minMinutes,
  maxMinutes,
  stepMinutes,
}: {
  id: string;
  locale: string;
  value: string;
  onChange: (next: string) => void;
  minMinutes: number;
  maxMinutes: number;
  stepMinutes: number;
}) {
  const allowed = useMemo(() => {
    const out: number[] = [];
    for (let m = minMinutes; m <= maxMinutes; m += stepMinutes) out.push(m);
    return out;
  }, [minMinutes, maxMinutes, stepMinutes]);

  const raw = timeToMinutes(value);
  const clamped = clamp(raw, minMinutes, maxMinutes);
  const safe = nearestAllowed(clamped, allowed);

  const { hh24, mm, hh12, ampm } = minutesToParts(safe);

  if (isFrLocale(locale)) {
    const hourOptions = useMemo(() => {
      const minH = Math.floor(minMinutes / 60);
      const maxH = Math.floor(maxMinutes / 60);
      const arr: number[] = [];
      for (let h = minH; h <= maxH; h++) arr.push(h);
      return arr;
    }, [minMinutes, maxMinutes]);

    const minuteOptions = useMemo(() => {
      const minsForHour = allowed
        .filter((m) => Math.floor(m / 60) === hh24)
        .map((m) => m % 60);
      return Array.from(new Set(minsForHour)).sort((a, b) => a - b);
    }, [allowed, hh24]);

    useEffect(() => {
      if (!minuteOptions.includes(mm)) {
        const fallback = minuteOptions[0] ?? 0;
        const next = nearestAllowed(hh24 * 60 + fallback, allowed);
        onChange(minutesToTime(next));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minuteOptions.join('|'), hh24]);

    return (
      <div className="grid grid-cols-2 gap-2">
        <select
          id={`${id}-hour`}
          value={hh24}
          onChange={(e) => {
            const newH = Number(e.target.value);
            const candidate = newH * 60 + mm;
            const next = nearestAllowed(
              clamp(candidate, minMinutes, maxMinutes),
              allowed
            );
            onChange(minutesToTime(next));
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {pad2(h)}
            </option>
          ))}
        </select>

        <select
          id={`${id}-min`}
          value={mm}
          onChange={(e) => {
            const newM = Number(e.target.value);
            const candidate = hh24 * 60 + newM;
            const next = nearestAllowed(
              clamp(candidate, minMinutes, maxMinutes),
              allowed
            );
            onChange(minutesToTime(next));
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {pad2(m)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const ampmOptions = useMemo(() => {
    const s = new Set<Meridiem>();
    for (const m of allowed) s.add(minutesToParts(m).ampm);
    return Array.from(s);
  }, [allowed]);

  const hour12Options = useMemo(() => {
    const s = new Set<number>();
    for (const m of allowed) {
      const p = minutesToParts(m);
      if (p.ampm === ampm) s.add(p.hh12);
    }
    return Array.from(s).sort((a, b) => a - b);
  }, [allowed, ampm]);

  const minuteOptions = useMemo(() => {
    const s = new Set<number>();
    for (const m of allowed) {
      const p = minutesToParts(m);
      if (p.ampm === ampm && p.hh12 === hh12) s.add(p.mm);
    }
    return Array.from(s).sort((a, b) => a - b);
  }, [allowed, ampm, hh12]);

  useEffect(() => {
    const safeAmpm: Meridiem = ampmOptions.includes(ampm)
      ? ampm
      : ampmOptions[0] ?? 'AM';
    const safeHour12 = hour12Options.includes(hh12)
      ? hh12
      : hour12Options[0] ?? 12;
    const safeMin = minuteOptions.includes(mm) ? mm : minuteOptions[0] ?? 0;

    const candidate = partsToMinutes(safeHour12, safeMin, safeAmpm);
    const next = nearestAllowed(
      clamp(candidate, minMinutes, maxMinutes),
      allowed
    );

    if (next !== safe) onChange(minutesToTime(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ampmOptions.join('|'), hour12Options.join('|'), minuteOptions.join('|')]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        id={`${id}-hour12`}
        value={hh12}
        onChange={(e) => {
          const newH12 = Number(e.target.value);
          const candidate = partsToMinutes(newH12, mm, ampm);
          const next = nearestAllowed(
            clamp(candidate, minMinutes, maxMinutes),
            allowed
          );
          onChange(minutesToTime(next));
        }}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        required
      >
        {hour12Options.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <select
        id={`${id}-min`}
        value={mm}
        onChange={(e) => {
          const newM = Number(e.target.value);
          const candidate = partsToMinutes(hh12, newM, ampm);
          const next = nearestAllowed(
            clamp(candidate, minMinutes, maxMinutes),
            allowed
          );
          onChange(minutesToTime(next));
        }}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        required
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {pad2(m)}
          </option>
        ))}
      </select>

      <select
        id={`${id}-ampm`}
        value={ampm}
        onChange={(e) => {
          const newAmpm = e.target.value as Meridiem;
          const candidate = partsToMinutes(hh12, mm, newAmpm);
          const next = nearestAllowed(
            clamp(candidate, minMinutes, maxMinutes),
            allowed
          );
          onChange(minutesToTime(next));
        }}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        required
      >
        {ampmOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DailyOverridesCard() {
  const t = useTranslations('dailyOverrides');
  const locale = useLocale();

  const [date, setDate] = useState<string>(todayISO());
  const [kind, setKind] = useState<Kind>('available');
  const [startTime, setStartTime] = useState('05:00');
  const [endTime, setEndTime] = useState('05:30');

  const [entries, setEntries] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const [upcomingEntries, setUpcomingEntries] = useState<DayAvailability[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  // --- Fetch pour un jour donné ---
  const fetchEntries = async (dateParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/availabilities/day?date=${dateParam}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: DayAvailability[] = await res.json();
      setEntries(data);
    } catch (e: any) {
      console.error('Error fetching day availabilities:', e);
      setError(t('error_load_day'));
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch pour tous les créneaux à venir ---
  const fetchUpcoming = async () => {
    setLoadingUpcoming(true);
    try {
      const res = await fetch('/api/availabilities/day?scope=upcoming', {
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: DayAvailability[] = await res.json();

      const sorted = [...data].sort((a, b) => {
        const aKey = `${a.date} ${a.startTime}`;
        const bKey = `${b.date} ${b.startTime}`;
        return aKey.localeCompare(bKey);
      });

      setUpcomingEntries(sorted);
    } catch (e) {
      console.error('Error fetching upcoming day availabilities:', e);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  // quand la date change → on recharge la liste du jour
  useEffect(() => {
    if (!date) return;
    void fetchEntries(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // au montage → on charge la liste "à venir"
  useEffect(() => {
    void fetchUpcoming();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/availabilities/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          kind,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      showNotice(
        kind === 'available'
          ? t('notice_added_available')
          : t('notice_added_unavailable')
      );
      setStartTime('05:00');
      setEndTime('05:30');

      await fetchEntries(date);
      await fetchUpcoming();
    } catch (e: any) {
      console.error('Error creating day availability:', e);
      setError(e?.message || t('error_create'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/availabilities/day/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      showNotice(t('notice_deleted'));
      await fetchEntries(date);
      await fetchUpcoming();
    } catch (e: any) {
      console.error('Error deleting day availability:', e);
      setError(t('error_delete'));
    }
  };

  const availables = entries.filter((e) => e.kind === 'available');
  const unavailables = entries.filter((e) => e.kind === 'unavailable');

  const formatDayLabel = (iso: string) => formatShortDateFromISO(iso, locale);

  const formatKindBadge = (kind: Kind) =>
    kind === 'available' ? t('badge_available') : t('badge_unavailable');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">{t('field_date_label')}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <div className="text-xs text-muted-foreground">
                {date ? formatShortDateFromISO(date, locale) : ''}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('field_type_label')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={kind === 'available' ? 'default' : 'outline'}
                  onClick={() => setKind('available')}
                  className="flex-1"
                >
                  {t('type_available')}
                </Button>
                <Button
                  type="button"
                  variant={kind === 'unavailable' ? 'default' : 'outline'}
                  onClick={() => setKind('unavailable')}
                  className="flex-1"
                >
                  {t('type_unavailable')}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('field_start_label')}</Label>
              <TimeSelect5mLocale
                id="startTime"
                locale={locale}
                value={startTime}
                minMinutes={MIN_TIME_MINUTES}
                maxMinutes={MAX_TIME_MINUTES - STEP_MINUTES}
                stepMinutes={STEP_MINUTES}
                onChange={(nextStart) => {
                  const nextStartMin = timeToMinutes(nextStart);
                  const currentEndMin = timeToMinutes(endTime);

                  const minEnd = Math.min(
                    nextStartMin + STEP_MINUTES,
                    MAX_TIME_MINUTES
                  );
                  const nextEndMin = clamp(
                    currentEndMin,
                    minEnd,
                    MAX_TIME_MINUTES
                  );

                  setStartTime(nextStart);
                  setEndTime(minutesToTime(nextEndMin));
                }}
              />
              <div className="text-xs text-muted-foreground">
                {formatTimeForLocale(startTime, locale)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('field_end_label')}</Label>
              <TimeSelect5mLocale
                id="endTime"
                locale={locale}
                value={endTime}
                minMinutes={Math.min(
                  timeToMinutes(startTime) + STEP_MINUTES,
                  MAX_TIME_MINUTES
                )}
                maxMinutes={MAX_TIME_MINUTES}
                stepMinutes={STEP_MINUTES}
                onChange={setEndTime}
              />
              <div className="text-xs text-muted-foreground">
                {formatTimeForLocale(endTime, locale)}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? t('button_saving') : t('button_submit')}
            </Button>
          </div>
        </form>

        {/* Tous les créneaux à venir */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-medium">{t('upcoming_title')}</p>

          {loadingUpcoming ? (
            <p className="text-sm text-muted-foreground">
              {t('upcoming_loading')}
            </p>
          ) : upcomingEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('upcoming_empty')}
            </p>
          ) : (
            <ul className="space-y-1">
              {upcomingEntries.map((e) => {
                // ✅ ICI (au début du map)
                const startLabel = formatTimeForLocale(e.startTime, locale);
                const endLabel = formatTimeForLocale(e.endTime, locale);

                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between text-sm border rounded-md px-2 py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted/60 font-mono">
                        {formatDayLabel(e.date)}
                      </span>

                      {/* ✅ affichage heure localisé */}
                      <span className="font-mono">
                        {startLabel} – {endLabel}
                      </span>

                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded uppercase ${
                          e.kind === 'available'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {formatKindBadge(e.kind)}
                      </span>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
