'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getDayAvailabilities,
  getSlotsForWeek,
  getTravelsForWeek,
} from '@/lib/client/api/availabilities-client';
import { addDaysISO, todayWeekStartISO } from '@/lib/availability-utils';
import type { DayAvailability, Slot, Travel } from '@/types/availability';

type Options = {
  meRole: string | null;
  userId: string | null;
  userLoaded: boolean;
  loadErrorMessage: string;
};

export function useWeeklyGlobalAgendaData({
  meRole,
  userId,
  userLoaded,
  loadErrorMessage,
}: Options) {
  const [weekStart, setWeekStart] = useState<string>(() => todayWeekStartISO());
  const [entriesByDate, setEntriesByDate] = useState<
    Record<string, DayAvailability[]>
  >({});
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [travelsByDate, setTravelsByDate] = useState<Record<string, Travel[]>>(
    {}
  );
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeek = useCallback(async () => {
    if (!userId) {
      setEntriesByDate({});
      setSlotsByDate({});
      setTravelsByDate({});
      return;
    }

    setLoadingWeek(true);
    setError(null);

    try {
      const dates = Array.from({ length: 7 }, (_, index) =>
        addDaysISO(weekStart, index)
      );
      const weekEndISO = addDaysISO(weekStart, 6);

      const weekExceptionsPromise = Promise.all(
        dates.map(async (dateIso) => {
          const data = await getDayAvailabilities(
            { date: dateIso },
            { fallbackMessage: `${loadErrorMessage} (${dateIso})` }
          );
          return [dateIso, data] as const;
        })
      );

      const slotsPromise = (async () => {
        try {
          const slots = await getSlotsForWeek(
            { from: weekStart, to: weekEndISO },
            { fallbackMessage: 'Failed to fetch slots for week' }
          );

          const visibleSlots = slots.filter((slot) => {
            return slot.clientUserId === userId || slot.dogsitterUserId === userId;
          });

          const grouped: Record<string, Slot[]> = {};
          for (const slot of visibleSlots) {
            const key = (slot.date || '').slice(0, 10);
            if (!key) continue;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(slot);
          }

          return grouped;
        } catch (nextError) {
          console.error('Error fetching slots for week', nextError);
          return {} as Record<string, Slot[]>;
        }
      })();

      const travelsPromise = (async () => {
        try {
          if (meRole === 'student') {
            return {} as Record<string, Travel[]>;
          }

          const travels = await getTravelsForWeek(
            { from: weekStart, to: weekEndISO },
            { fallbackMessage: 'Failed to fetch travels for week' }
          );

          const visibleTravels = travels.filter((travel) => {
            return (
              travel.dogsitterUserId === userId || travel.clientUserId === userId
            );
          });

          const grouped: Record<string, Travel[]> = {};
          for (const travel of visibleTravels) {
            const key =
              typeof travel.date === 'string' ? travel.date.slice(0, 10) : '';
            if (!key) continue;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(travel);
          }

          return grouped;
        } catch (nextError) {
          console.error('Error fetching travels for week', nextError);
          return {} as Record<string, Travel[]>;
        }
      })();

      const [results, groupedSlots, groupedTravels] = await Promise.all([
        weekExceptionsPromise,
        slotsPromise,
        travelsPromise,
      ]);

      const groupedEntries: Record<string, DayAvailability[]> = {};
      for (const [dateIso, entries] of results) {
        groupedEntries[dateIso] = entries;
      }

      setEntriesByDate(groupedEntries);
      setSlotsByDate(groupedSlots);
      setTravelsByDate(groupedTravels);
    } catch (nextError) {
      console.error('Error fetching weekly agenda', nextError);
      setError(loadErrorMessage);
    } finally {
      setLoadingWeek(false);
    }
  }, [loadErrorMessage, meRole, userId, weekStart]);

  useEffect(() => {
    if (!userLoaded) return;
    void fetchWeek();
  }, [fetchWeek, userLoaded]);

  const weekEndISO = useMemo(() => addDaysISO(weekStart, 6), [weekStart]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDaysISO(weekStart, index)),
    [weekStart]
  );

  return {
    weekStart,
    weekEndISO,
    weekDates,
    entriesByDate,
    slotsByDate,
    travelsByDate,
    loadingWeek,
    error,
    goToPreviousWeek: () => setWeekStart((prev) => addDaysISO(prev, -7)),
    goToNextWeek: () => setWeekStart((prev) => addDaysISO(prev, 7)),
  };
}
