'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  addDaysISO,
  computeDisabledDays,
  dateToISO,
  END_HOUR,
  getExactBookableSlotsForWindow,
  PIXELS_PER_HOUR,
  START_HOUR,
  startOfWeekMondayISO,
  type ClientBookingSlot,
  type SelectedBookingService,
  type SelectedBookingSlot,
  type WeeklyAgendaResponse,
} from '@/components/booking/booking-page-shared';
import {
  computeScoredBookingOptionsFromAgenda,
  computeSuggestionsFromAgenda,
  findNearbyBetterSuggestion,
  type SuggestedBookingSlot,
} from '@/components/booking/booking-proposals-shared';
import { isHttpError } from '@/lib/client/api/request';
import { useBookSlot } from '@/lib/client/hooks/useBookSlot';
import { useBookingServices } from '@/lib/client/hooks/useBookingServices';
import { useDecodedBookingAddress } from '@/lib/client/hooks/useDecodedBookingAddress';
import { useInstructorWeeklyAgenda } from '@/lib/client/hooks/useInstructorWeeklyAgenda';
import { devLogger } from '@/lib/shared/dev-logger';
import {
  getEarliestAllowedDateTime,
  toBookingAddressPayload,
} from '@/lib/client/utils/booking';

type SelectedBookingWindow = {
  date: string;
  slot: ClientBookingSlot;
};

function toSelectedBookingSlot(slot: SuggestedBookingSlot): SelectedBookingSlot {
  return {
    date: slot.date,
    windowStartTime: slot.windowStartTime,
    windowEndTime: slot.windowEndTime,
    serviceStartTime: slot.serviceStartTime,
    serviceEndTime: slot.serviceEndTime,
    travelBeforeMinutes: slot.travelBeforeMinutes,
    travelAfterMinutes: slot.travelAfterMinutes,
    fromLabel: slot.fromLabel,
    toLabel: slot.toLabel,
    alignment: 'start',
  };
}

function getSelectedSlotId(slot: SelectedBookingSlot | null) {
  if (!slot) return null;
  return `${slot.date}-${slot.serviceStartTime}-${slot.serviceEndTime}`;
}

export function useBookPageState() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const selectedServiceId = searchParams.get('serviceId');
  const targetClientUserId = searchParams.get('clientUserId');

  const t = useTranslations('bookAgenda');
  const locale = useLocale();

  const [todayWeekStart] = useState(() => startOfWeekMondayISO());
  const [maxWeekStart] = useState(() => addDaysISO(startOfWeekMondayISO(), 40 * 7));
  const [weekStart, setWeekStart] = useState<string>(() => startOfWeekMondayISO());

  const [serviceError, setServiceError] = useState<string | null>(null);
  const [selectedService, setSelectedService] =
    useState<SelectedBookingService | null>(null);
  const [selectedWindow, setSelectedWindow] =
    useState<SelectedBookingWindow | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedBookingSlot | null>(
    null,
  );
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeAlternative, setNudgeAlternative] =
    useState<SuggestedBookingSlot | null>(null);

  const weekEnd = useMemo(() => addDaysISO(weekStart, 6), [weekStart]);
  const earliestAllowed = useMemo(() => getEarliestAllowedDateTime(), []);
  const now = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => dateToISO(new Date()), []);
  const isCurrentWeek = weekStart === todayWeekStart;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - START_HOUR * 60) / 60) * PIXELS_PER_HOUR;
  const showNowLine =
    isCurrentWeek &&
    nowMinutes >= START_HOUR * 60 &&
    nowMinutes <= END_HOUR * 60;
  const canGoPrevWeek = weekStart > todayWeekStart;
  const canGoNextWeek = weekStart < maxWeekStart;

  const { bookSlot, loading: bookingLoading } = useBookSlot({
    errorMessage: t('errors.createBooking'),
  });
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
  } = useBookingServices({
    enabled: isLoaded && isSignedIn,
    loadErrorMessage: t('errors.loadServicesApi'),
  });

  const bookingAddress = useDecodedBookingAddress(searchParams.get('addr'), {
    onError: (error) => {
      devLogger.error('[BOOKING] invalid addr param', error);
    },
  });

  const agendaEnabled =
    isLoaded &&
    isSignedIn &&
    !!selectedService &&
    (selectedService.isRemote || !!bookingAddress);

  const {
    data: agendaData,
    loading,
    error,
    reload: reloadAgenda,
  } = useInstructorWeeklyAgenda({
    enabled: agendaEnabled,
    weekStart,
    isRemote: selectedService?.isRemote ?? false,
    bookingAddress: selectedService?.isRemote ? null : bookingAddress,
    clientUserId: targetClientUserId,
    loadErrorMessage: t('errors.loadAgendaApi'),
  });

  const data = agendaData as WeeklyAgendaResponse | null;

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDaysISO(weekStart, index)),
    [weekStart],
  );

  useEffect(() => {
    if (!selectedServiceId) {
      setSelectedService(null);
      setServiceError(null);
      return;
    }

    const numericId = Number(selectedServiceId);
    if (!Number.isFinite(numericId)) {
      setSelectedService(null);
      setServiceError(t('errors.invalidServiceUrl'));
      return;
    }

    if (servicesError) {
      setSelectedService(null);
      setServiceError(servicesError);
      return;
    }

    if (servicesLoading) {
      return;
    }

    const service = services.find((item) => item.id === numericId);
    if (!service) {
      setSelectedService(null);
      setServiceError(t('errors.serviceNotAvailable'));
      const params = new URLSearchParams();
      if (targetClientUserId) {
        params.set('clientUserId', targetClientUserId);
      }
      const suffix = params.toString();
      router.push(`/${locale}/book/services${suffix ? `?${suffix}` : ''}`);
      return;
    }

    setServiceError(null);
    setSelectedService({
      id: service.id,
      name: service.name,
      categoryName: service.category_name,
      durationMinutes: service.duration_minutes,
      isRemote: !!service.is_remote,
    });
  }, [
    locale,
    router,
    selectedServiceId,
    services,
    servicesError,
    servicesLoading,
    targetClientUserId,
    t,
  ]);

  const scoredBookingOptions = useMemo(
    () =>
      data && selectedService?.durationMinutes
        ? computeScoredBookingOptionsFromAgenda(
            data,
            selectedService.durationMinutes,
          )
        : [],
    [data, selectedService?.durationMinutes],
  );

  const recommendedSuggestions = useMemo(
    () =>
      data && selectedService?.durationMinutes
        ? computeSuggestionsFromAgenda(data, selectedService.durationMinutes, 4)
        : [],
    [data, selectedService?.durationMinutes],
  );

  const scoredBookingOptionsById = useMemo(
    () =>
      new Map(scoredBookingOptions.map((slot) => [slot.id, slot] as const)),
    [scoredBookingOptions],
  );

  const recommendedSlotIds = useMemo(
    () => new Set(recommendedSuggestions.map((slot) => slot.id)),
    [recommendedSuggestions],
  );

  const recommendedWindowCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const slot of recommendedSuggestions) {
      const key = `${slot.date}-${slot.windowStartTime}-${slot.windowEndTime}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [recommendedSuggestions]);

  const selectedWindowExactSlots = useMemo(() => {
    if (!selectedWindow) {
      return [] as SuggestedBookingSlot[];
    }

    const fallbackHasBookingsToday = Boolean(
      data?.bookedSlots?.some((slot) => slot.date === selectedWindow.date),
    );

    return getExactBookableSlotsForWindow({
      dateIso: selectedWindow.date,
      rawSlot: selectedWindow.slot,
      serviceDuration: selectedService?.durationMinutes,
      earliestAllowed,
    }).map((slot) => {
      const scoredSlot = scoredBookingOptionsById.get(slot.id);
      return (
        scoredSlot ?? {
          ...slot,
          hasBookingsToday: fallbackHasBookingsToday,
          score: 0,
        }
      );
    });
  }, [
    data?.bookedSlots,
    earliestAllowed,
    scoredBookingOptionsById,
    selectedService?.durationMinutes,
    selectedWindow,
  ]);

  useEffect(() => {
    if (!selectedWindow) {
      return;
    }

    if (selectedWindowExactSlots.length !== 1) {
      return;
    }

    setSelectedSlot(toSelectedBookingSlot(selectedWindowExactSlots[0]));
  }, [selectedWindow, selectedWindowExactSlots]);

  const currentSuggestedSlot = useMemo(() => {
    const selectedSlotId = getSelectedSlotId(selectedSlot);
    return selectedSlotId ? scoredBookingOptionsById.get(selectedSlotId) ?? null : null;
  }, [scoredBookingOptionsById, selectedSlot]);

  const dayDisabled = useMemo(
    () =>
      computeDisabledDays({
        data,
        weekDates,
        serviceDuration: selectedService?.durationMinutes,
        earliestAllowed,
      }),
    [data, earliestAllowed, selectedService?.durationMinutes, weekDates],
  );

  const handlePrevWeek = () => {
    setWeekStart((previous) => {
      const nextWeek = addDaysISO(previous, -7);
      return nextWeek < todayWeekStart ? previous : nextWeek;
    });
    setSelectedWindow(null);
    setSelectedSlot(null);
  };

  const handleNextWeek = () => {
    setWeekStart((previous) => {
      const nextWeek = addDaysISO(previous, 7);
      return nextWeek > maxWeekStart ? previous : nextWeek;
    });
    setSelectedWindow(null);
    setSelectedSlot(null);
  };

  const handleCurrentWeek = () => {
    setWeekStart(todayWeekStart);
    setSelectedWindow(null);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (dateIso: string, slot: ClientBookingSlot) => {
    setSelectedWindow({
      date: dateIso,
      slot,
    });

    const selectedWindowId = `${dateIso}-${slot.startTime}-${slot.endTime}`;
    const isSameWindow =
      selectedSlot &&
      `${selectedSlot.date}-${selectedSlot.windowStartTime}-${selectedSlot.windowEndTime}` ===
        selectedWindowId;

    if (!isSameWindow) {
      setSelectedSlot(null);
    }

    devLogger.log('[BOOKING] selected availability window', {
      dateIso,
      slot,
      serviceId: selectedService?.id,
    });
  };

  const handleSelectExactSlot = (slot: SuggestedBookingSlot) => {
    const nextSelection = toSelectedBookingSlot(slot);
    setSelectedSlot(nextSelection);

    devLogger.log('[BOOKING] selected exact slot', {
      serviceId: selectedService?.id,
      slot: nextSelection,
    });
  };

  const handleConfirmBooking = async (overrideSlot?: SelectedBookingSlot) => {
    if (!selectedService) {
      toast.error(t('errors.noServiceSelected'));
      return;
    }

    const slot = overrideSlot ?? selectedSlot;
    if (!slot) {
      toast.error(t('errors.noSlotSelected'));
      return;
    }

    if (!slot.serviceStartTime || !slot.serviceEndTime) {
      toast.error(t('errors.invalidSlot'));
      return;
    }

    try {
      await bookSlot({
        serviceId: selectedService.id,
        date: slot.date,
        startTime: slot.serviceStartTime,
        endTime: slot.serviceEndTime,
        bookingAddress: toBookingAddressPayload(bookingAddress),
        clientUserId: targetClientUserId,
      });

      toast.success(t('alerts.bookingSuccess'));
      setSelectedSlot(null);
      setSelectedWindow(null);
      setNudgeOpen(false);
      setNudgeAlternative(null);
      await reloadAgenda();
    } catch (nextError: unknown) {
      devLogger.error('[BOOKING] error', nextError);
      if (
        isHttpError<{ error?: string }>(nextError) &&
        nextError.status === 409 &&
        nextError.data?.error === 'SLOT_ALREADY_EXISTS'
      ) {
        toast.error(t('errors.slotAlreadyBooked'));
        return;
      }

      toast.error(
        nextError instanceof Error
          ? nextError.message
          : t('errors.createBookingGeneric'),
      );
    }
  };

  const handleRequestBooking = () => {
    if (!currentSuggestedSlot || recommendedSlotIds.has(currentSuggestedSlot.id)) {
      void handleConfirmBooking();
      return;
    }

    const alternative = findNearbyBetterSuggestion({
      currentSlot: currentSuggestedSlot,
      scoredSlots: scoredBookingOptions,
    });

    if (!alternative) {
      void handleConfirmBooking();
      return;
    }

    setNudgeAlternative(alternative);
    setNudgeOpen(true);
  };

  const handleKeepCurrentChoice = () => {
    setNudgeOpen(false);
    void handleConfirmBooking();
  };

  const handleSwitchToAlternative = () => {
    if (!nudgeAlternative) {
      setNudgeOpen(false);
      return;
    }

    const alternativeSelection = toSelectedBookingSlot(nudgeAlternative);
    setSelectedSlot(alternativeSelection);
    setSelectedWindow({
      date: nudgeAlternative.date,
      slot: {
        startTime: nudgeAlternative.windowStartTime,
        endTime: nudgeAlternative.windowEndTime,
        travelBeforeMinutes: nudgeAlternative.travelBeforeMinutes,
        travelAfterMinutes: nudgeAlternative.travelAfterMinutes,
        fromLabel: nudgeAlternative.fromLabel,
        toLabel: nudgeAlternative.toLabel,
      },
    });
    setNudgeOpen(false);

    void handleConfirmBooking(alternativeSelection);
  };

  return {
    agendaData: data,
    bookingAddress,
    bookingLoading,
    canGoNextWeek,
    canGoPrevWeek,
    currentSuggestedSlot,
    dayDisabled,
    earliestAllowed,
    error,
    handleKeepCurrentChoice,
    handleCurrentWeek,
    handleNextWeek,
    handlePrevWeek,
    handleRequestBooking,
    handleSelectExactSlot,
    handleSelectSlot,
    handleSwitchToAlternative,
    isCurrentWeek,
    isLoaded,
    isSignedIn,
    loading,
    locale,
    nowTop,
    nudgeAlternative,
    nudgeOpen,
    recommendedSlotIds,
    recommendedWindowCounts,
    selectedService,
    selectedSlot,
    selectedWindow,
    selectedWindowExactSlots,
    serviceError,
    setNudgeOpen,
    showNowLine,
    t,
    todayIso,
    weekDates,
    weekEnd,
    weekStart,
  };
}
