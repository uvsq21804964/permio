'use client';

import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useTranslations, useLocale } from 'next-intl';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const START_HOUR = 5;
const END_HOUR = 23;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => i + START_HOUR
);
const PIXELS_PER_HOUR = 80;
const MIN_TIME_MINUTES = START_HOUR * 60;
const MAX_TIME_MINUTES = END_HOUR * 60;
const STEP_MINUTES = 5;

type Meridiem = 'AM' | 'PM';

type User = {
  id: string;
  name: string;
  role: string;
};

type Availability = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  user: User;
};

type TimeRange = {
  startTime: string;
  endTime: string;
};

type UserHours = {
  plannedMinutes: number | null;
  remainingMinutes: number | null;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (m: number) => {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

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

const getAvailabilityStyle = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const startOffsetMinutes = startMinutes - START_HOUR * 60;
  const durationMinutes = endMinutes - startMinutes;

  const top = (startOffsetMinutes / 60) * PIXELS_PER_HOUR;
  const height = (durationMinutes / 60) * PIXELS_PER_HOUR;

  return { top, height };
};

const getDurationColor = (startTime: string, endTime: string) => {
  const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);

  if (durationMinutes < 30) {
    return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100';
  } else if (durationMinutes < 60) {
    return 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100';
  } else if (durationMinutes < 120) {
    return 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100';
  } else {
    return 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100';
  }
};

/** Affiche en heures si multiple de 30 min (X h / X.5 h), sinon en minutes */
function formatQty(m?: number | null): string {
  if (typeof m !== 'number' || !Number.isFinite(m)) return '—';
  if (m < 0) return '0 min';
  if (m % 30 === 0) {
    const h = m / 60;
    return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`;
  }
  return `${m} min`;
}

function isFrLocale(locale: string) {
  return locale === 'fr' || locale.startsWith('fr');
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

/** "08:30" -> "08:30" / "8:30 AM" selon locale */
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

/** Colonne heures : FR "08:00" / EN "8 AM" */
function formatHourLabel(hour: number, locale: string): string {
  if (isFrLocale(locale)) return `${String(hour).padStart(2, '0')}:00`;
  const d = new Date(2000, 0, 1, hour, 0, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
  }).format(d);
}

export function AvailabilityAgenda() {
  const t = useTranslations('availabilityAgenda');
  const locale = useLocale();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '05:00', endTime: '05:30' },
  ]);
  const [error, setError] = useState<string>('');
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const [roleReady, setRoleReady] = useState(false);
  const [availReady, setAvailReady] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // heures par utilisateur (clé = userId)
  const [userHours, setUserHours] = useState<Record<string, UserHours>>({});

  // NOTIFS + "dernière modif"
  const [notice, setNotice] = useState<string | null>(null);
  const [lastChangeAt, setLastChangeAt] = useState<Date | null>(null);

  // Affiche une notif pendant 5s
  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 5000);
  };

  // RelativeTimeFormat selon la locale
  const rtf = useMemo(
    () =>
      new Intl.RelativeTimeFormat(
        locale === 'fr' || locale.startsWith('fr') ? 'fr' : 'en',
        { numeric: 'auto' }
      ),
    [locale]
  );

  const formatRelativeFrom = (d: Date) => {
    const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
    if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
    const diffHour = Math.round(diffMin / 60);
    if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour');
    const diffDay = Math.round(diffHour / 24);
    return rtf.format(-diffDay, 'day');
  };

  // petit tick pour rafraîchir l'affichage relatif automatiquement
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // 1) Charger l’utilisateur courant (id/nom/rôle)
  useEffect(() => {
    setUsersError(null);

    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setSelectedUserId('');
      setUsers([]);
      setRoleReady(false);
      return;
    }

    const fallbackDisplayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      t('userLabel.selfFallback');

    (async () => {
      try {
        setRoleReady(false);
        const res = await fetch('/api/me/role', { credentials: 'include' });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const me: { id: string; name?: string; role: string } =
          await res.json();

        setUsers([
          { id: me.id, name: me.name || fallbackDisplayName, role: me.role },
        ]);
        setSelectedUserId(me.id);
        setRoleReady(true);
      } catch (e) {
        console.error('/api/me/role failed:', e);
        setUsersError(t('errors.currentUser'));
        setUsers([{ id: userId, name: fallbackDisplayName, role: 'student' }]);
        setSelectedUserId(userId);
        setRoleReady(true);
      }
    })();
  }, [isLoaded, isSignedIn, userId, user, t]);

  // 1.b heures (restant/planifiées)
  useEffect(() => {
    if (!roleReady || !selectedUserId) return;

    (async () => {
      try {
        const res = await fetch('/api/me/hours', { credentials: 'include' });
        if (!res.ok)
          throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
        const data: {
          plannedMinutes: number | null;
          remainingMinutes: number | null;
          role?: string | null;
        } = await res.json();

        setUserHours((prev) => ({
          ...prev,
          [selectedUserId]: {
            plannedMinutes:
              typeof data.plannedMinutes === 'number'
                ? data.plannedMinutes
                : null,
            remainingMinutes:
              typeof data.remainingMinutes === 'number'
                ? data.remainingMinutes
                : null,
          },
        }));
      } catch (e) {
        console.warn('/api/me/hours failed', e);
      }
    })();
  }, [roleReady, selectedUserId]);

  // 2) Charger les dispos de l’utilisateur (semaine "par défaut")
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    if (!roleReady) return;

    const fetchAvailabilities = async () => {
      setLoadingAvail(true);
      setAvailReady(false);
      try {
        const res = await fetch(`/api/availabilities`, {
          credentials: 'include',
        });
        if (!res.ok)
          throw new Error(`Erreur API /api/availabilities (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.availabilities)
          ? data.availabilities
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setAvailabilities(list);
      } catch (e) {
        console.error('[v0] Error fetching availabilities:', e);
        setAvailabilities([]);
      } finally {
        setLoadingAvail(false);
        setAvailReady(true);
      }
    };

    void fetchAvailabilities();
  }, [isLoaded, isSignedIn, userId, roleReady]);

  const handleCellClick = (day: number, hour: number) => {
    if (!isEditing) return; // 👈 bloque en mode lecture

    const start = Math.max(
      MIN_TIME_MINUTES,
      Math.min(hour * 60, MAX_TIME_MINUTES - STEP_MINUTES)
    );
    const end = Math.min(start + 60, MAX_TIME_MINUTES);

    setSelectedDay(day);
    setTimeRanges([
      {
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      },
    ]);
    setError('');
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { startTime: '05:00', endTime: '05:30' }]);
  };

  const removeTimeRange = (index: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay === null || !selectedUserId) return;

    setError('');

    // validations
    for (let i = 0; i < timeRanges.length; i++) {
      const { startTime, endTime } = timeRanges[i];
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (endMinutes <= startMinutes) {
        setError(
          t('errors.rangeOrder', {
            index: i + 1,
          })
        );
        return;
      }
      if (startMinutes < MIN_TIME_MINUTES || endMinutes > MAX_TIME_MINUTES) {
        setError(
          t('errors.rangeBounds', {
            index: i + 1,
          })
        );
        return;
      }
      if (
        startMinutes % STEP_MINUTES !== 0 ||
        endMinutes % STEP_MINUTES !== 0
      ) {
        setError(
          t('errors.rangeStep', {
            index: i + 1,
          })
        );
        return;
      }
    }

    try {
      for (const range of timeRanges) {
        const res = await fetch('/api/availabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            dayOfWeek: selectedDay,
            startTime: range.startTime,
            endTime: range.endTime,
          }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(`POST /api/availabilities ${res.status} ${msg}`);
        }
      }

      const response = await fetch('/api/availabilities', {
        credentials: 'include',
      });
      if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(`GET /api/availabilities ${response.status} ${msg}`);
      }
      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.availabilities)
        ? data.availabilities
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setAvailabilities(list);

      setDialogOpen(false);
      setTimeRanges([{ startTime: '05:00', endTime: '05:30' }]);
      setLastChangeAt(new Date());

      if (timeRanges.length > 1) {
        showNotice(
          t('notices.manyAdded', {
            count: timeRanges.length,
          })
        );
      } else {
        showNotice(
          t('notices.oneAdded', {
            start: formatTimeForLocale(timeRanges[0].startTime, locale),
            end: formatTimeForLocale(timeRanges[0].endTime, locale),
          })
        );
      }

      setError('');
    } catch (err) {
      console.error('[v0] Error creating availabilities:', err);
      setError(t('errors.createRange'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        const refresh = await fetch('/api/availabilities', {
          credentials: 'include',
        });
        if (!refresh.ok) {
          console.error('Refresh failed', await refresh.text().catch(() => ''));
          return;
        }
        const data = await refresh.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.availabilities)
          ? data.availabilities
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setAvailabilities(list);
        setLastChangeAt(new Date());
        showNotice(t('notices.slotDeleted'));
      } else {
        console.error(
          '[v0] Error deleting availability:',
          response.status,
          await response.text().catch(() => '')
        );
      }
    } catch (error) {
      console.error('[v0] Error deleting availability:', error);
    }
  };

  const getAvailabilitiesForDay = (day: number) => {
    return availabilities.filter((avail) => avail.dayOfWeek === day);
  };

  // Libellé utilisateur
  const renderUserLabel = (u: User) => {
    const roleLabel =
      u.role === 'instructor'
        ? t('userLabel.instructor')
        : t('userLabel.student');
    return `${u.name} (${roleLabel})`;
  };

  const dayLabels = useMemo(() => {
    const weekdayLocale = isFrLocale(locale) ? 'fr-FR' : 'en-US';
    // base date (lundi) juste pour générer lun/mar/...
    const baseMonday = new Date(2000, 0, 3); // 2000-01-03 = lundi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      return d.toLocaleDateString(weekdayLocale, { weekday: 'long' }); // ou 'short'
    });
  }, [locale]);

  return (
    <>
      {roleReady && availReady ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{t('title')}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('description')}
                </p>

                {/* Heures restant/total si élève */}
                {selectedUserId &&
                  users.length > 0 &&
                  (() => {
                    const u = users.find((x) => x.id === selectedUserId);
                    if (!u) return null;
                    if (u.role !== 'student') return null;
                    const hrs = userHours[u.id];
                    if (
                      !hrs ||
                      typeof hrs.remainingMinutes !== 'number' ||
                      typeof hrs.plannedMinutes !== 'number'
                    )
                      return null;
                    return (
                      <p className="text-muted-foreground text-sm mt-2">
                        {t('hoursLabel')}{' '}
                        <span className="text-xs rounded px-1.5 py-0.5 border bg-amber-200 border-amber-400 text-amber-900">
                          {formatQty(hrs.remainingMinutes)}
                        </span>
                        <span className="text-xs text-neutral-500"> / </span>
                        <span className="text-xs rounded px-1.5 py-0.5 border bg-green-200 border-green-500 text-neutral-800">
                          {formatQty(hrs.plannedMinutes)}
                        </span>
                      </p>
                    );
                  })()}

                <p className="text-muted-foreground text-sm mt-2">
                  {isEditing ? t('editing.hintOn') : t('editing.hintOff')}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="text-sm">
                  <span className="font-medium">
                    {users[0]
                      ? renderUserLabel(users[0])
                      : t('userLabel.selfFallback')}
                  </span>
                </div>
                {lastChangeAt && (
                  <div className="text-xs text-neutral-500">
                    {t('meta.lastUpdate', {
                      value: formatRelativeFrom(lastChangeAt),
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant={isEditing ? 'default' : 'outline'}
                  className="mt-1"
                  onClick={() => setIsEditing((prev) => !prev)}
                >
                  {isEditing ? t('buttons.editOn') : t('buttons.editOff')}
                </Button>
              </div>
            </div>
          </CardHeader>

          {notice && (
            <div className="px-6">
              <Alert className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {notice}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header row */}
                <div className="grid grid-cols-8 gap-0">
                  <div className="font-medium text-sm text-muted-foreground p-2 border-b">
                    {t('table.hourColumn')}
                  </div>
                  {dayLabels.map((label, index) => (
                    <div
                      key={index}
                      className="font-medium text-sm text-center p-2 border-b border-r"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Time slots grid */}
                <div className="grid grid-cols-8 gap-0">
                  {/* Hours column */}
                  <div>
                    {HOURS.map((hour) => (
                      <div
                        key={`hour-${hour}`}
                        className="text-sm text-muted-foreground p-2 border-r border-b"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      >
                        {formatHourLabel(hour, locale)}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {dayLabels.map((_, dayIndex) => (
                    <div key={`day-${dayIndex}`} className="relative border-r">
                      {/* Hour cells */}
                      {HOURS.map((hour) => (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className={
                            'border-b transition-colors ' +
                            (isEditing
                              ? 'cursor-pointer hover:bg-muted/50'
                              : '')
                          }
                          style={{ height: `${PIXELS_PER_HOUR}px` }}
                          onClick={
                            isEditing
                              ? () => handleCellClick(dayIndex, hour)
                              : undefined
                          }
                        />
                      ))}

                      {/* Availability blocks */}
                      {getAvailabilitiesForDay(dayIndex).map((avail) => {
                        const { top, height } = getAvailabilityStyle(
                          avail.startTime,
                          avail.endTime
                        );

                        // ✅ ICI (après getAvailabilityStyle)
                        const startLabel = formatTimeForLocale(
                          avail.startTime,
                          locale
                        );
                        const endLabel = formatTimeForLocale(
                          avail.endTime,
                          locale
                        );

                        const colorClass = getDurationColor(
                          avail.startTime,
                          avail.endTime
                        );

                        return (
                          <div
                            key={avail.id}
                            className={`absolute left-1 right-1 text-xs p-1.5 rounded-md border group transition-colors ${
                              isEditing ? 'cursor-pointer' : 'cursor-default'
                            } ${colorClass}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              minHeight: '24px',
                            }}
                            onClick={
                              isEditing
                                ? (e) => {
                                    e.stopPropagation();
                                    void handleDelete(avail.id);
                                  }
                                : undefined
                            }
                            // ✅ title localisé
                            title={`${startLabel}–${endLabel}`}
                          >
                            <div className="flex items-start justify-between gap-1 h-full">
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="text-[10px] font-medium leading-tight truncate">
                                  {/* ✅ affichage localisé */}
                                  {startLabel} – {endLabel}
                                </div>
                              </div>

                              {isEditing && (
                                <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          {usersError
            ? t('errors.loadStatusOrAvailabilities')
            : loadingAvail
            ? t('errors.loadAvailabilities')
            : t('errors.loadingGeneric')}
        </div>
      )}

      {/* Dialog ajout plage */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('dialog.dayLabel')}</Label>
              <Input
                value={
                  selectedDay !== null ? t(`days.${selectedDay}` as any) : ''
                }
                disabled
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

              {timeRanges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t('dialog.startLabel')}
                      </Label>

                      <TimeSelect5mLocale
                        id={`start-${index}`}
                        locale={locale}
                        value={range.startTime}
                        minMinutes={MIN_TIME_MINUTES}
                        maxMinutes={MAX_TIME_MINUTES - STEP_MINUTES}
                        stepMinutes={STEP_MINUTES}
                        onChange={(nextStart) => {
                          const nextStartMin = timeToMinutes(nextStart);

                          setTimeRanges((prev) => {
                            const next = [...prev];
                            const currentEndMin = timeToMinutes(
                              next[index].endTime
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

                            next[index] = {
                              ...next[index],
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
                        id={`end-${index}`}
                        locale={locale}
                        minMinutes={Math.min(
                          timeToMinutes(range.startTime) + STEP_MINUTES,
                          MAX_TIME_MINUTES
                        )}
                        maxMinutes={MAX_TIME_MINUTES}
                        stepMinutes={STEP_MINUTES}
                        value={range.endTime}
                        onChange={(nextEnd) => {
                          setTimeRanges((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], endTime: nextEnd };
                            return next;
                          });
                        }}
                      />

                      <div className="text-[11px] text-muted-foreground">
                        {formatTimeForLocale(range.endTime, locale)}
                      </div>
                    </div>
                  </div>
                  {timeRanges.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeRange(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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
