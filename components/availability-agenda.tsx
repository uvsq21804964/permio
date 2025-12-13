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

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 → 19:00
const START_HOUR = 8;
const PIXELS_PER_HOUR = 80;

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

export function AvailabilityAgenda() {
  const t = useTranslations('availabilityAgenda');
  const locale = useLocale();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '08:00', endTime: '09:00' },
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

    setSelectedDay(day);
    setTimeRanges([
      {
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      },
    ]);
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { startTime: '08:00', endTime: '09:00' }]);
  };

  const removeTimeRange = (index: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((_, i) => i !== index));
    }
  };

  const updateTimeRange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updated = [...timeRanges];
    updated[index][field] = value;
    setTimeRanges(updated);
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
      if (startMinutes < START_HOUR * 60 || endMinutes > 20 * 60) {
        setError(
          t('errors.rangeBounds', {
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
      setTimeRanges([{ startTime: '08:00', endTime: '09:00' }]);
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
            start: timeRanges[0].startTime,
            end: timeRanges[0].endTime,
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

  const dayLabels = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => t(`days.${i}` as any) // typescript est un peu chiant ici
      ),
    [t]
  );

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
                        {hour}:00
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
                            title={`${avail.startTime}–${avail.endTime}`}
                          >
                            <div className="flex items-start justify-between gap-1 h-full">
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="text-[10px] font-medium leading-tight truncate">
                                  {avail.startTime} – {avail.endTime}
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
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`start-${index}`} className="text-xs">
                        {t('dialog.startLabel')}
                      </Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        min="08:00"
                        max="20:00"
                        value={range.startTime}
                        onChange={(e) =>
                          updateTimeRange(index, 'startTime', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`end-${index}`} className="text-xs">
                        {t('dialog.endLabel')}
                      </Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        min="08:00"
                        max="20:00"
                        value={range.endTime}
                        onChange={(e) =>
                          updateTimeRange(index, 'endTime', e.target.value)
                        }
                        required
                      />
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
