'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

const START_HOUR = 5; // grille: 05:00 → 23:00
const END_HOUR = 23;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => i + START_HOUR
);

const PIXELS_PER_HOUR = 72;

const MIN_TIME_MINUTES = 5 * 60; // 05:00
const MAX_TIME_MINUTES = 23 * 60; // 23:00
const STEP_MINUTES = 5;

type Meridiem = 'AM' | 'PM';

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
  const hh12 = ((hh24 + 11) % 12) + 1; // 1..12

  return { hh24, mm, hh12, ampm };
}

function partsToMinutes(hh12: number, mm: number, ampm: Meridiem) {
  const h = hh12 % 12; // 12 -> 0
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

function isFrLocale(locale: string) {
  return locale === 'fr' || locale.startsWith('fr');
}

/**
 * Selecteur temps:
 * - FR: HH(05..23) + MM(00/05..55)
 * - EN: HH(1..12) + MM(00/05..55) + AM/PM
 * value stockée en "HH:MM" 24h
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
  value: string; // "HH:MM" 24h
  onChange: (next: string) => void;
  minMinutes: number;
  maxMinutes: number;
  stepMinutes: number;
}) {
  // liste de tous les instants autorisés (pas de 5 min + bornes)
  const allowed = useMemo(() => {
    const out: number[] = [];
    for (let m = minMinutes; m <= maxMinutes; m += stepMinutes) out.push(m);
    return out;
  }, [minMinutes, maxMinutes, stepMinutes]);

  // value -> minutes (24h)
  const raw = timeToMinutes(value);
  const clamped = clamp(raw, minMinutes, maxMinutes);
  const safe = nearestAllowed(clamped, allowed);

  // parse current parts from safe
  const { hh24, mm, hh12, ampm } = minutesToParts(safe);

  // ------- MODE FR (24h) -------
  if (isFrLocale(locale)) {
    const hourOptions = useMemo(() => {
      const minH = Math.floor(minMinutes / 60);
      const maxH = Math.floor(maxMinutes / 60);
      const arr: number[] = [];
      for (let h = minH; h <= maxH; h++) arr.push(h);
      return arr;
    }, [minMinutes, maxMinutes]);

    const minuteOptions = useMemo(() => {
      // minutes possibles pour l'heure hh24 en respectant bornes + step
      const minsForHour = allowed
        .filter((m) => Math.floor(m / 60) === hh24)
        .map((m) => m % 60);
      return Array.from(new Set(minsForHour)).sort((a, b) => a - b);
    }, [allowed, hh24]);

    // si minute actuelle invalide, recale sur la première valide
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

  // ------- MODE EN (12h + AM/PM) -------
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

  // recale si la sélection actuelle tombe hors options
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

function parseTime(t: string) {
  const [hh, mm] = t.split(':').map(Number);
  return { hh: Number.isFinite(hh) ? hh : 0, mm: Number.isFinite(mm) ? mm : 0 };
}

function buildHourOptions(minMinutes: number, maxMinutes: number) {
  const minH = Math.floor(minMinutes / 60);
  const maxH = Math.floor(maxMinutes / 60);
  const out: number[] = [];
  for (let h = minH; h <= maxH; h++) out.push(h);
  return out;
}

function buildMinuteOptionsForHour(
  hour: number,
  minMinutes: number,
  maxMinutes: number,
  stepMinutes: number
) {
  const out: number[] = [];
  const minH = Math.floor(minMinutes / 60);
  const maxH = Math.floor(maxMinutes / 60);

  let minM = 0;
  let maxM = 59;

  if (hour === minH) minM = minMinutes % 60;
  if (hour === maxH) maxM = maxMinutes % 60;

  // aligne sur le pas (5 min)
  const start = Math.ceil(minM / stepMinutes) * stepMinutes;
  const end = Math.floor(maxM / stepMinutes) * stepMinutes;

  for (let m = start; m <= end; m += stepMinutes) out.push(m);
  return out;
}

function TimeSelect5m({
  id,
  value,
  onChange,
  minMinutes,
  maxMinutes,
  stepMinutes,
}: {
  id: string;
  value: string; // "HH:MM"
  onChange: (next: string) => void;
  minMinutes: number;
  maxMinutes: number;
  stepMinutes: number;
}) {
  // clamp value dans les bornes
  const vMin = timeToMinutes(value);
  const clamped = clamp(vMin, minMinutes, maxMinutes);
  const safeValue = minutesToTime(clamped);

  const { hh, mm } = parseTime(safeValue);

  const hourOptions = useMemo(
    () => buildHourOptions(minMinutes, maxMinutes),
    [minMinutes, maxMinutes]
  );

  const minuteOptions = useMemo(
    () => buildMinuteOptionsForHour(hh, minMinutes, maxMinutes, stepMinutes),
    [hh, minMinutes, maxMinutes, stepMinutes]
  );

  // si les minutes actuelles ne sont pas valides pour cet hour, on recale
  useEffect(() => {
    if (!minuteOptions.includes(mm)) {
      const fallback = minuteOptions[0] ?? 0;
      onChange(`${pad2(hh)}:${pad2(fallback)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hh, minuteOptions.join('|')]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Heures */}
      <select
        id={`${id}-hour`}
        value={hh}
        onChange={(e) => {
          const newH = Number(e.target.value);
          const minsForNewH = buildMinuteOptionsForHour(
            newH,
            minMinutes,
            maxMinutes,
            stepMinutes
          );
          const newM = minsForNewH.includes(mm) ? mm : minsForNewH[0] ?? 0;
          onChange(`${pad2(newH)}:${pad2(newM)}`);
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

      {/* Minutes */}
      <select
        id={`${id}-min`}
        value={mm}
        onChange={(e) => {
          const newM = Number(e.target.value);
          onChange(`${pad2(hh)}:${pad2(newM)}`);
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

type Availability = {
  id?: string;
  dayOfWeek: number; // 0..6
  startTime: string;
  endTime: string;
};

type TimeRange = {
  startTime: string;
  endTime: string;
};

type AddressDetails = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  googlePlaceId?: string;
};

type Props = {
  onboarding?: {
    address: AddressDetails;
    rawInput: string;
    agencyName: string;
    websiteUrl: string;
  } | null;
  onOnboarded?: (data: { organizationId?: string }) => void;
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (m: number) => {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

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

function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let m = MIN_TIME_MINUTES; m <= MAX_TIME_MINUTES; m += STEP_MINUTES) {
    out.push(minutesToTime(m));
  }
  return out;
}

function mergeAvailabilities(list: Availability[]): Availability[] {
  const byDay = new Map<number, Availability[]>();
  for (const a of list) {
    const arr = byDay.get(a.dayOfWeek) ?? [];
    arr.push(a);
    byDay.set(a.dayOfWeek, arr);
  }

  const merged: Availability[] = [];

  for (const [day, arr] of byDay.entries()) {
    const sorted = [...arr]
      .map((x) => ({
        ...x,
        _s: timeToMinutes(x.startTime),
        _e: timeToMinutes(x.endTime),
      }))
      .sort((a, b) => a._s - b._s || a._e - b._e);

    const out: { s: number; e: number }[] = [];
    for (const x of sorted) {
      if (out.length === 0) {
        out.push({ s: x._s, e: x._e });
        continue;
      }
      const last = out[out.length - 1];
      if (x._s <= last.e) {
        last.e = Math.max(last.e, x._e);
      } else {
        out.push({ s: x._s, e: x._e });
      }
    }

    for (const r of out) {
      merged.push({
        dayOfWeek: day,
        startTime: minutesToTime(r.s),
        endTime: minutesToTime(r.e),
      });
    }
  }

  return merged.sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

const slotKey = (a: Availability) =>
  `${a.dayOfWeek}|${a.startTime}|${a.endTime}`;

const getBlockStyle = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const startOffset = startMinutes - START_HOUR * 60;
  const duration = endMinutes - startMinutes;

  const top = (startOffset / 60) * PIXELS_PER_HOUR;
  const height = (duration / 60) * PIXELS_PER_HOUR;

  return { top, height };
};

const getDurationClass = (startTime: string, endTime: string) => {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (duration < 30) return 'bg-emerald-50 border-emerald-300 text-emerald-900';
  if (duration < 60) return 'bg-blue-50 border-blue-300 text-blue-900';
  if (duration < 120) return 'bg-indigo-50 border-indigo-300 text-indigo-900';
  return 'bg-purple-50 border-purple-300 text-purple-900';
};

export default function AssociateAgencyAvailability({
  onboarding = null,
  onOnboarded,
}: Props) {
  const t = useTranslations('availabilityAgenda');
  const locale = useLocale();

  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const [saved, setSaved] = useState<Availability[]>([]);
  const [draft, setDraft] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(!onboarding);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '05:00', endTime: '05:30' },
  ]);

  const [error, setError] = useState<string>('');

  const dayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, i) => t(`days.${i}` as any)),
    [t]
  );

  const fetchAvailabilities = async () => {
    if (onboarding) {
      setLoading(false);
      setSaved([]);
      setDraft([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/availabilities', {
        credentials: 'include',
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.availabilities)
        ? data.availabilities
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const merged = mergeAvailabilities(list);
      setSaved(merged);
      setDraft(merged);
    } catch {
      setSaved([]);
      setDraft([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAvailabilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    const a = new Set(saved.map(slotKey));
    const b = new Set(draft.map(slotKey));
    if (a.size !== b.size) return true;
    for (const k of a) if (!b.has(k)) return true;
    return false;
  }, [saved, draft]);

  const getForDay = (day: number) => draft.filter((a) => a.dayOfWeek === day);

  const handleCellClick = (day: number, hour: number) => {
    // clamp start/end in bounds
    const start = Math.max(
      MIN_TIME_MINUTES,
      Math.min(hour * 60, MAX_TIME_MINUTES - STEP_MINUTES)
    );
    const end = Math.min(start + 60, MAX_TIME_MINUTES);

    setSelectedDay(day);
    setTimeRanges([
      { startTime: minutesToTime(start), endTime: minutesToTime(end) },
    ]);
    setError('');
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setTimeRanges((prev) => [
      ...prev,
      { startTime: '05:00', endTime: '05:30' },
    ]);
  };

  const removeTimeRange = (index: number) => {
    setTimeRanges((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay === null) return;

    setError('');

    for (let i = 0; i < timeRanges.length; i++) {
      const { startTime, endTime } = timeRanges[i];
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);

      if (end <= start) {
        setError(t('errors.rangeOrder', { index: i + 1 }));
        return;
      }

      if (start < MIN_TIME_MINUTES || end > MAX_TIME_MINUTES) {
        setError(
          locale.startsWith('fr')
            ? `Plage autorisée : 05:00 à 23:00.`
            : `Allowed range: 05:00 to 23:00.`
        );
        return;
      }

      if (start % STEP_MINUTES !== 0 || end % STEP_MINUTES !== 0) {
        setError(
          locale.startsWith('fr')
            ? `Choisissez des pas de 5 minutes.`
            : `Please use 5-minute increments.`
        );
        return;
      }
    }

    setDraft((prev) => {
      const next = [...prev];
      for (const r of timeRanges) {
        next.push({
          dayOfWeek: selectedDay,
          startTime: r.startTime,
          endTime: r.endTime,
        });
      }
      return mergeAvailabilities(next);
    });

    setDialogOpen(false);
    setTimeRanges([{ startTime: '05:00', endTime: '05:30' }]);
  };

  const handleDeleteDraft = (slot: Availability) => {
    setDraft((prev) => prev.filter((x) => slotKey(x) !== slotKey(slot)));
  };

  const resetDraft = () => {
    setDraft(saved);
    setError('');
  };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      const normalizedDraft = mergeAvailabilities(draft);
      if (normalizedDraft.length === 0) {
        setError(
          locale.startsWith('fr')
            ? 'Ajoutez au moins une disponibilité.'
            : 'Please add at least one availability.'
        );
        return;
      }

      const payloadAvailabilities = normalizedDraft.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
      }));

      if (onboarding) {
        const res = await fetch('/api/onboarding/trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            agencyName: onboarding.agencyName,
            websiteUrl: onboarding.websiteUrl,
            address: onboarding.address,
            rawInput: onboarding.rawInput,
            availabilities: payloadAvailabilities,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data?.details || data?.error || `HTTP ${res.status}`);

        onOnboarded?.({
          organizationId: data?.organizationId || data?.clerkOrgId,
        });
        return;
      }

      const res = await fetch('/api/availabilities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ availabilities: payloadAvailabilities }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      await fetchAvailabilities();
    } catch (e: any) {
      setError(
        e?.message ||
          (locale.startsWith('fr')
            ? "Impossible d'enregistrer vos disponibilités."
            : 'Unable to save your availability.')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-5 md:p-6 text-sm text-black/60">
        {locale.startsWith('fr') ? 'Chargement…' : 'Loading…'}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-5 md:p-6 w-full">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base md:text-lg font-semibold text-black">
              {locale.startsWith('fr')
                ? 'Vos disponibilités'
                : 'Your availability'}
            </div>
            <div className="text-sm text-black/55">
              {locale.startsWith('fr')
                ? 'Cliquez dans la grille pour ajouter des plages.'
                : 'Click in the grid to add time ranges.'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!onboarding && dirty ? (
              <span className="text-xs text-black/50 whitespace-nowrap">
                {locale.startsWith('fr')
                  ? 'Modifications non enregistrées'
                  : 'Unsaved changes'}
              </span>
            ) : null}

            {!onboarding && dirty ? (
              <Button
                type="button"
                variant="outline"
                onClick={resetDraft}
                disabled={saving}
              >
                {locale.startsWith('fr') ? 'Annuler' : 'Reset'}
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={saveAll}
              disabled={saving || (!onboarding && !dirty)}
            >
              {saving
                ? locale.startsWith('fr')
                  ? 'Validation…'
                  : 'Saving…'
                : locale.startsWith('fr')
                ? 'Valider'
                : 'Save'}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-8">
              <div className="p-2 text-xs text-black/50 border-b">
                {t('table.hourColumn')}
              </div>
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="p-2 text-xs font-semibold text-center border-b border-l"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-8">
              <div>
                {HOURS.map((hour) => {
                  const hourLabel = formatTimeForLocale(
                    `${String(hour).padStart(2, '0')}:00`,
                    locale
                  );
                  return (
                    <div
                      key={`h-${hour}`}
                      className="p-2 text-xs text-black/45 border-b"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                    >
                      {hourLabel}
                    </div>
                  );
                })}
              </div>

              {dayLabels.map((_, dayIndex) => (
                <div key={`d-${dayIndex}`} className="relative border-l">
                  {HOURS.map((hour) => (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="border-b cursor-pointer hover:bg-black/[0.03] transition-colors"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                      onClick={() => handleCellClick(dayIndex, hour)}
                    />
                  ))}

                  {getForDay(dayIndex).map((a, idx) => {
                    const { top, height } = getBlockStyle(
                      a.startTime,
                      a.endTime
                    );
                    const color = getDurationClass(a.startTime, a.endTime);

                    const startLabel = formatTimeForLocale(a.startTime, locale);
                    const endLabel = formatTimeForLocale(a.endTime, locale);

                    return (
                      <div
                        key={`${dayIndex}-${a.startTime}-${a.endTime}-${idx}`}
                        className={[
                          'absolute left-1 right-1 rounded-xl border px-2 py-1 text-[11px]',
                          'shadow-[0_10px_25px_rgba(0,0,0,0.08)] group',
                          color,
                        ].join(' ')}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: '26px',
                        }}
                        title={`${startLabel} – ${endLabel}`}
                      >
                        <div className="flex items-center justify-between gap-2 h-full">
                          <div className="truncate font-semibold">
                            {startLabel} – {endLabel}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraft(a);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitDraft} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('dialog.dayLabel')}</Label>
              <Input
                value={
                  selectedDay !== null ? t(`days.${selectedDay}` as any) : ''
                }
                disabled
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('dialog.rangesLabel')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeRange}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('buttons.addSlot')}
                </Button>
              </div>

              {timeRanges.map((range, i) => {
                const startMax = MAX_TIME_MINUTES - STEP_MINUTES; // 22:55 max (car end > start)
                const startMin = MIN_TIME_MINUTES;

                const startMinutes = timeToMinutes(range.startTime);
                const endMin = Math.min(
                  startMinutes + STEP_MINUTES,
                  MAX_TIME_MINUTES
                );
                const endMax = MAX_TIME_MINUTES;

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 border rounded-2xl"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('dialog.startLabel')}
                        </Label>

                        <TimeSelect5mLocale
                          id={`start-${i}`}
                          locale={locale}
                          value={range.startTime}
                          minMinutes={startMin}
                          maxMinutes={startMax}
                          stepMinutes={STEP_MINUTES}
                          onChange={(nextStart) => {
                            const nextStartMin = timeToMinutes(nextStart);

                            setTimeRanges((prev) => {
                              const next = [...prev];
                              const currentEndMin = timeToMinutes(
                                next[i].endTime
                              );

                              const minEnd = Math.min(
                                nextStartMin + STEP_MINUTES,
                                MAX_TIME_MINUTES
                              );
                              const nextEndMin = clamp(
                                currentEndMin,
                                minEnd,
                                MAX_TIME_MINUTES
                              );

                              next[i] = {
                                ...next[i],
                                startTime: nextStart,
                                endTime: minutesToTime(nextEndMin),
                              };
                              return next;
                            });
                          }}
                        />

                        <div className="text-[11px] text-muted-foreground">
                          {formatTimeForLocale(range.startTime, locale)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('dialog.endLabel')}
                        </Label>

                        <TimeSelect5mLocale
                          id={`end-${i}`}
                          locale={locale}
                          value={range.endTime}
                          minMinutes={endMin}
                          maxMinutes={endMax}
                          stepMinutes={STEP_MINUTES}
                          onChange={(nextEnd) => {
                            setTimeRanges((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], endTime: nextEnd };
                              return next;
                            });
                          }}
                        />

                        <div className="text-[11px] text-muted-foreground">
                          {formatTimeForLocale(range.endTime, locale)}
                        </div>
                      </div>
                    </div>

                    {timeRanges.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeRange(i)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t('buttons.cancel')}
              </Button>
              <Button type="submit">{t('buttons.submit')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
