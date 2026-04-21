'use client';

import type React from 'react';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Trash2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimeSelect5mLocale } from '@/components/availability/TimeSelect5mLocale';
import { todayISO } from '@/lib/availability-utils';
import { useDayOverrides } from '@/lib/client/hooks/useDayOverrides';
import {
  clamp,
  DEFAULT_AVAILABILITY_MAX_MINUTES,
  DEFAULT_AVAILABILITY_MINUTES,
  DEFAULT_AVAILABILITY_STEP_MINUTES,
  formatTimeForLocale,
  isFrLocale,
  minutesToTime,
  timeToMinutes,
} from '@/lib/client/utils/availability-time';
import type { Kind } from '@/types/availability';

const MIN_TIME_MINUTES = DEFAULT_AVAILABILITY_MINUTES;
const MAX_TIME_MINUTES = DEFAULT_AVAILABILITY_MAX_MINUTES;
const STEP_MINUTES = DEFAULT_AVAILABILITY_STEP_MINUTES;

function formatShortDateFromISO(iso: string, locale: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(year || 2000, (month || 1) - 1, day || 1, 0, 0, 0, 0);
  const dayValue = String(date.getDate()).padStart(2, '0');
  const monthValue = String(date.getMonth() + 1).padStart(2, '0');

  return isFrLocale(locale)
    ? `${dayValue}/${monthValue}`
    : `${monthValue}/${dayValue}`;
}

export function DailyOverridesCard() {
  const t = useTranslations('dailyOverrides');
  const locale = useLocale();

  const [date, setDate] = useState<string>(todayISO());
  const [kind, setKind] = useState<Kind>('available');
  const [startTime, setStartTime] = useState('05:00');
  const [endTime, setEndTime] = useState('05:30');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    entries,
    upcomingEntries,
    loading,
    loadingUpcoming,
    error,
    setError,
    createOverride,
    removeOverride,
  } = useDayOverrides({
    date,
    loadDayErrorMessage: t('error_load_day'),
    loadUpcomingErrorMessage: t('upcoming_loading'),
  });

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!date) return;

    setError(null);
    setSaving(true);

    try {
      await createOverride({
        date,
        startTime,
        endTime,
        kind,
      });

      showNotice(
        kind === 'available'
          ? t('notice_added_available')
          : t('notice_added_unavailable')
      );
      setStartTime('05:00');
      setEndTime('05:30');
    } catch (nextError: any) {
      console.error('Error creating day availability:', nextError);
      setError(nextError?.message || t('error_create'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeOverride(id, date);
      showNotice(t('notice_deleted'));
    } catch (nextError: any) {
      console.error('Error deleting day availability:', nextError);
      setError(t('error_delete'));
    }
  };

  const formatDayLabel = (iso: string) => formatShortDateFromISO(iso, locale);
  const formatKindBadge = (value: Kind) =>
    value === 'available' ? t('badge_available') : t('badge_unavailable');

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">{t('field_date_label')}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
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
                  const nextStartMinutes = timeToMinutes(nextStart);
                  const currentEndMinutes = timeToMinutes(endTime);
                  const minEnd = Math.min(
                    nextStartMinutes + STEP_MINUTES,
                    MAX_TIME_MINUTES
                  );
                  const nextEndMinutes = clamp(
                    currentEndMinutes,
                    minEnd,
                    MAX_TIME_MINUTES
                  );

                  setStartTime(nextStart);
                  setEndTime(minutesToTime(nextEndMinutes));
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
              {upcomingEntries.map((entry) => {
                const startLabel = formatTimeForLocale(entry.startTime, locale);
                const endLabel = formatTimeForLocale(entry.endTime, locale);

                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between text-sm border rounded-md px-2 py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted/60 font-mono">
                        {formatDayLabel(entry.date)}
                      </span>
                      <span className="font-mono">
                        {startLabel} - {endLabel}
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded uppercase ${
                          entry.kind === 'available'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {formatKindBadge(entry.kind)}
                      </span>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(entry.id)}
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
