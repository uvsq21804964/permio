'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LastWeekAgendaGrid } from '@/components/schedule/LastWeekAgendaGrid';
import { LastWeekAgendaHeader } from '@/components/schedule/LastWeekAgendaHeader';
import {
  ApiDay,
  DAYS,
  getSlotColorClass,
  LastWeekAgendaResponse,
  Role,
  withLocalePath,
} from '@/components/schedule/last-week-agenda-shared';
import { useOwnServiceSummary } from '@/lib/client/hooks/useOwnServiceSummary';
import { useMyWeeks } from '@/lib/client/hooks/useMyWeeks';
import {
  addDaysToISO,
  formatShortDate,
  getMondayOfWeek,
  isFrenchLocale,
  parseISODateLocal,
  toISODateLocal,
} from '@/lib/client/utils/schedule-display';

export default function LastWeekAgenda({ userId }: { userId?: string }) {
  const router = useRouter();
  const t = useTranslations('myWeek');
  const locale = useLocale();

  const [currentWeekStartISO, setCurrentWeekStartISO] = useState<string | null>(
    () => toISODateLocal(getMondayOfWeek(new Date()))
  );
  const [showNoServicesModal, setShowNoServicesModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    data,
    loading,
    error,
    reload,
  } = useMyWeeks<LastWeekAgendaResponse>({
    userId,
    weekStart: currentWeekStartISO,
    loadErrorMessage: t('errors.genericLoad'),
  });

  const viewerRole = data?.user?.role;
  const isInstructor = viewerRole === 'instructor';
  const {
    servicesCount,
    joinCode,
    loading: servicesLoading,
    error: servicesErr,
  } = useOwnServiceSummary({
    enabled: isInstructor,
    loadErrorMessage: t('errors.genericLoad'),
  });

  useEffect(() => {
    if (!isInstructor) {
      setShowNoServicesModal(false);
      return;
    }

    if (servicesLoading || servicesErr) {
      return;
    }

    setShowNoServicesModal(servicesCount === 0);
  }, [isInstructor, servicesCount, servicesErr, servicesLoading]);

  const daysMap = useMemo(() => {
    const map = new Map<number, ApiDay>();
    data?.days?.forEach((day) => map.set(day.dayOfWeek, day));
    return map;
  }, [data?.days]);

  const dayHeaders = useMemo(() => {
    const getDayLabel = (index: number) => t(`days.${index}` as never);

    if (!data?.weekShown) {
      return DAYS.map((_, index) => ({
        label: getDayLabel(index),
        dateLabel: '',
        iso: '',
        isToday: false,
      }));
    }

    const weekStart = parseISODateLocal(data.weekShown);
    const todayISO = toISODateLocal(new Date());

    return DAYS.map((_, index) => {
      const day = daysMap.get(index);
      const date = day?.dayDate
        ? parseISODateLocal(day.dayDate)
        : new Date(weekStart.getTime());

      if (!day?.dayDate) {
        date.setDate(weekStart.getDate() + index);
      }

      const iso = toISODateLocal(date);
      return {
        label: getDayLabel(index),
        dateLabel: formatShortDate(date, locale),
        iso,
        isToday: iso === todayISO,
      };
    });
  }, [data?.weekShown, daysMap, locale, t]);

  const headerRange = useMemo(() => {
    if (!data?.weekShown) {
      return '';
    }

    const start = parseISODateLocal(data.weekShown);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const separator = isFrenchLocale(locale) ? ' -> ' : ' - ';

    return `${formatShortDate(start, locale)}${separator}${formatShortDate(
      end,
      locale
    )}`;
  }, [data?.weekShown, locale]);

  const partnerLegend = useMemo(() => {
    if (!data?.days) {
      return [] as Array<[string, string]>;
    }

    const legendByName = new Map<string, string>();

    for (const day of data.days) {
      for (const slot of day.slots ?? []) {
        const name =
          viewerRole === 'instructor'
            ? slot.studentName ?? t('legend.unknownStudent')
            : viewerRole === 'student'
              ? slot.instructorName ?? t('legend.unknownInstructor')
              : slot.studentName ??
                slot.instructorName ??
                t('legend.unknownPartner');

        if (!legendByName.has(name)) {
          legendByName.set(name, getSlotColorClass(slot, viewerRole));
        }
      }
    }

    return Array.from(legendByName.entries());
  }, [data?.days, t, viewerRole]);

  const upcoming = data?.nextSlots ?? [];
  const travelsByDate = data?.travelsByDate ?? {};
  const myServicesUrl = withLocalePath('/services', locale);
  const bookingServicesUrl = withLocalePath('/book/services', locale);

  const handleCopyJoinCode = async () => {
    if (!joinCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      alert(
        isFrenchLocale(locale)
          ? 'Impossible de copier automatiquement. Copie le code manuellement.'
          : 'Auto-copy failed. Please copy the code manually.'
      );
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <LastWeekAgendaHeader
        copied={copied}
        error={error}
        headerRange={headerRange}
        joinCode={joinCode}
        locale={locale}
        onCopyJoinCode={handleCopyJoinCode}
        onCurrentWeek={() => {
          setCurrentWeekStartISO(toISODateLocal(getMondayOfWeek(new Date())));
        }}
        onNextWeek={() =>
          setCurrentWeekStartISO((previous) =>
            addDaysToISO(previous ?? toISODateLocal(getMondayOfWeek(new Date())), 7)
          )
        }
        onOpenBooking={() => router.push(bookingServicesUrl)}
        onOpenServices={() => router.push(myServicesUrl)}
        onPrevWeek={() =>
          setCurrentWeekStartISO((previous) =>
            addDaysToISO(previous ?? toISODateLocal(getMondayOfWeek(new Date())), -7)
          )
        }
        partnerLegend={partnerLegend}
        servicesCount={servicesCount}
        servicesErr={servicesErr}
        servicesLoading={servicesLoading}
        showNoServicesModal={showNoServicesModal}
        t={t as unknown as (key: string, values?: Record<string, unknown>) => string}
        upcoming={upcoming}
        user={data?.user}
      />

      <div className="overflow-x-auto p-4">
        {loading ? (
          <div className="text-sm text-neutral-500">{t('loading')}</div>
        ) : !data ? (
          <div className="text-sm text-neutral-500">{t('errors.noAgenda')}</div>
        ) : (
          <LastWeekAgendaGrid
            dayHeaders={dayHeaders}
            daysMap={daysMap}
            locale={locale}
            onSlotCancelled={reload}
            showTravels={Boolean(viewerRole && viewerRole !== 'student')}
            t={t as unknown as (key: string, values?: Record<string, unknown>) => string}
            travelsByDate={travelsByDate}
            viewerRole={viewerRole as Role | undefined}
          />
        )}
      </div>
    </div>
  );
}
