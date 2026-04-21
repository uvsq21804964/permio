'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AvailabilityAgendaHours,
  AvailabilityAgendaUser,
  formatQty,
} from '@/components/availability/availability-agenda-shared';

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

type AvailabilityAgendaHeaderProps = {
  currentUser: AvailabilityAgendaUser | null;
  formatRelativeFrom: (date: Date) => string;
  hours: AvailabilityAgendaHours | null;
  isEditing: boolean;
  lastChangeAt: Date | null;
  notice: string | null;
  onToggleEditing: () => void;
  t: TranslateFn;
};

export function AvailabilityAgendaHeader({
  currentUser,
  formatRelativeFrom,
  hours,
  isEditing,
  lastChangeAt,
  notice,
  onToggleEditing,
  t,
}: AvailabilityAgendaHeaderProps) {
  const renderUserLabel = (value: AvailabilityAgendaUser) => {
    const roleLabel =
      value.role === 'instructor'
        ? t('userLabel.instructor')
        : t('userLabel.student');
    return `${value.name} (${roleLabel})`;
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{t('title')}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>

          {currentUser?.role === 'student' &&
          hours &&
          typeof hours.remainingMinutes === 'number' &&
          typeof hours.plannedMinutes === 'number' ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('hoursLabel')}{' '}
              <span className="rounded border border-amber-400 bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900">
                {formatQty(hours.remainingMinutes)}
              </span>
              <span className="text-xs text-neutral-500"> / </span>
              <span className="rounded border border-green-500 bg-green-200 px-1.5 py-0.5 text-xs text-neutral-800">
                {formatQty(hours.plannedMinutes)}
              </span>
            </p>
          ) : null}

          <p className="mt-2 text-sm text-muted-foreground">
            {isEditing ? t('editing.hintOn') : t('editing.hintOff')}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-sm">
            <span className="font-medium">
              {currentUser ? renderUserLabel(currentUser) : t('userLabel.selfFallback')}
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
            onClick={onToggleEditing}
          >
            {isEditing ? t('buttons.editOn') : t('buttons.editOff')}
          </Button>
        </div>
      </div>

      {notice && (
        <div className="px-6">
          <Alert className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{notice}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
