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

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08 → 19
const START_HOUR = 8;
const PIXELS_PER_HOUR = 72;

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
  onOnboarded?: (data: { organizationId?: string }) => void; // ✅ modif
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number) => {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

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
      // chevauchement ou adjacent => fusion
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

  const [saved, setSaved] = useState<Availability[]>([]);
  const [draft, setDraft] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(!onboarding);

  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '08:00', endTime: '09:00' },
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
    setSelectedDay(day);
    setTimeRanges([
      {
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      },
    ]);
    setError('');
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setTimeRanges((prev) => [
      ...prev,
      { startTime: '08:00', endTime: '09:00' },
    ]);
  };

  const removeTimeRange = (index: number) => {
    setTimeRanges((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const updateTimeRange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setTimeRanges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
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
      if (start < START_HOUR * 60 || end > 20 * 60) {
        setError(t('errors.rangeBounds', { index: i + 1 }));
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
    setTimeRanges([{ startTime: '08:00', endTime: '09:00' }]);
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

      // ✅ ONBOARDING TRAINER: 1 seule API => crée "User" puis insert dispos
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

      // ✅ HORS ONBOARDING: bulk replace (delete all + insert)
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
                {HOURS.map((hour) => (
                  <div
                    key={`h-${hour}`}
                    className="p-2 text-xs text-black/45 border-b"
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                  >
                    {hour}:00
                  </div>
                ))}
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
                        title={`${a.startTime}–${a.endTime}`}
                      >
                        <div className="flex items-center justify-between gap-2 h-full">
                          <div className="truncate font-semibold">
                            {a.startTime} – {a.endTime}
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

              {timeRanges.map((range, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 border rounded-2xl"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`start-${i}`} className="text-xs">
                        {t('dialog.startLabel')}
                      </Label>
                      <Input
                        id={`start-${i}`}
                        type="time"
                        min="08:00"
                        max="20:00"
                        value={range.startTime}
                        onChange={(e) =>
                          updateTimeRange(i, 'startTime', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`end-${i}`} className="text-xs">
                        {t('dialog.endLabel')}
                      </Label>
                      <Input
                        id={`end-${i}`}
                        type="time"
                        min="08:00"
                        max="20:00"
                        value={range.endTime}
                        onChange={(e) =>
                          updateTimeRange(i, 'endTime', e.target.value)
                        }
                        required
                      />
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
