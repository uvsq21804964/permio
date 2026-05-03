// app/[locale]/(routes)/(routes)/book/proposals/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { BookingSuggestionConfirmDialog } from '@/components/booking/BookingSuggestionConfirmDialog';
import { BookingSuggestionsGrid } from '@/components/booking/BookingSuggestionsGrid';
import {
  computeSuggestionsFromAgenda,
  type SuggestedBookingSlot,
} from '@/components/booking/booking-proposals-shared';
import { isHttpError } from '@/lib/client/api/request';
import type { InstructorAgendaResponse } from '@/lib/client/api/booking-client';
import { useBookSlot } from '@/lib/client/hooks/useBookSlot';
import { useBookingServices } from '@/lib/client/hooks/useBookingServices';
import { useDecodedBookingAddress } from '@/lib/client/hooks/useDecodedBookingAddress';
import { useInstructorProposalAgenda } from '@/lib/client/hooks/useInstructorProposalAgenda';
import { devLogger } from '@/lib/shared/dev-logger';
import {
  toBookingAddressPayload,
} from '@/lib/client/utils/booking';
import { type Locale, withLocale } from '@/src/lib/i18n';

export default function ProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('bookProposals');
  const locale = useLocale();
  const toLocalizedPath = (path: string) => withLocale(path, locale as Locale);

  const serviceIdParam = searchParams.get('serviceId');
  const addrParam = searchParams.get('addr');
  const clientUserId = searchParams.get('clientUserId');

  const bookingAddress = useDecodedBookingAddress(addrParam, {
    onError: (e) => {
      devLogger.error('[PROPOSALS BOOKING] invalid addr param', e);
    },
  });

  const [pendingSuggestion, setPendingSuggestion] = useState<SuggestedBookingSlot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { bookSlot, loading: bookingLoading } = useBookSlot({
    errorMessage: t('errors.createBooking'),
  });

  const {
    instructorId,
    services,
    loading,
    error: servicesError,
  } = useBookingServices({
    loadErrorMessage: t('errors.loadServicesApi'),
  });

  // Décoder l'adresse
  const selectedService = useMemo(() => {
    if (!serviceIdParam) return null;
    const idNum = Number(serviceIdParam);
    return services.find((s) => s.id === idNum) || null;
  }, [services, serviceIdParam]);
  const isRemote = !!selectedService?.is_remote;
  const {
    data: proposalAgenda,
    loading: loadingSuggestions,
    error: agendaError,
  } = useInstructorProposalAgenda({
    enabled:
      !!selectedService &&
      !!instructorId &&
      (selectedService.is_remote || !!bookingAddress),
    isRemote: selectedService?.is_remote ?? false,
    bookingAddress: selectedService?.is_remote ? null : bookingAddress,
    clientUserId,
    loadErrorMessage: t('errors.loadAgendaApi'),
  });

  const { suggestions, suggestionError } = useMemo(() => {
    if (!selectedService || !proposalAgenda) {
      return { suggestions: [], suggestionError: null as string | null };
    }

    try {
      return {
        suggestions: computeSuggestionsFromAgenda(
          proposalAgenda as InstructorAgendaResponse,
          selectedService.duration_minutes,
          4,
        ),
        suggestionError: null,
      };
    } catch (e) {
      devLogger.error('[PROPOSALS BOOKING] suggestion generation error', e);
      return {
        suggestions: [],
        suggestionError: t('errors.generateSlots'),
      };
    }
  }, [proposalAgenda, selectedService, t]);

  const handleBookSlot = async (slot: (typeof suggestions)[number]) => {
    if (!selectedService) return;

    try {
      await bookSlot({
        serviceId: selectedService.id,
        date: slot.date,
        startTime: slot.serviceStartTime,
        endTime: slot.serviceEndTime,
        bookingAddress: selectedService.is_remote
          ? undefined
          : toBookingAddressPayload(bookingAddress),
        clientUserId,
      });

      toast.success(t('booking.noticeSuccess'));
      setConfirmOpen(false);
      setPendingSuggestion(null);
      router.push(toLocalizedPath('/myweek'));
    } catch (e: unknown) {
      devLogger.error('[PROPOSALS BOOKING] error', e);
      if (
        isHttpError<{ error?: string }>(e) &&
        e.status === 409 &&
        e.data?.error === 'SLOT_ALREADY_EXISTS'
      ) {
        toast.error(t('errors.slotAlreadyBooked'));
        return;
      }

      toast.error(
        e instanceof Error ? e.message : t('errors.createBooking')
      );
    }
  };

  const handleOpenSuggestionConfirm = (slot: SuggestedBookingSlot) => {
    setPendingSuggestion(slot);
    setConfirmOpen(true);
  };

  const handleConfirmSuggestion = () => {
    if (!pendingSuggestion) {
      setConfirmOpen(false);
      return;
    }

    void handleBookSlot(pendingSuggestion);
  };

  const handleSeeAllSlots = () => {
    if (!selectedService) {
      router.push(toLocalizedPath('/book'));
      return;
    }
    const params = new URLSearchParams({
      serviceId: String(selectedService.id),
    });
    if (addrParam) {
      params.set('addr', addrParam);
    }
    if (clientUserId) {
      params.set('clientUserId', clientUserId);
    }
    router.push(toLocalizedPath(`/book?${params.toString()}`));
  };

  if (!serviceIdParam) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-sm text-muted-foreground space-y-3">
          <p>{t('noServiceSelected.title')}</p>
          <button
            type="button"
            onClick={() => router.push(toLocalizedPath('/book/services'))}
            className="text-primary text-xs underline"
          >
            {t('noServiceSelected.button')}
          </button>
        </div>
      </main>
    );
  }

  if (selectedService && !isRemote && !bookingAddress) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 space-y-3 text-sm">
          <p className="text-red-600">{t('errors.noBookingAddress')}</p>
          <button
            type="button"
            onClick={() =>
              router.push(
                toLocalizedPath(
                  `/book/address?${new URLSearchParams({
                    serviceId: serviceIdParam,
                    ...(clientUserId ? { clientUserId } : {}),
                  }).toString()}`
                )
              )
            }
            className="text-primary text-xs underline"
          >
            {t('noAddress.button')}
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-2xl border bg-card p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 w-64 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="grid gap-3 md:grid-cols-3 mt-4">
            <div className="h-28 rounded-lg bg-muted" />
            <div className="h-28 rounded-lg bg-muted" />
            <div className="h-28 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (servicesError || agendaError || suggestionError || !selectedService) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 space-y-3 text-sm">
          <p className="text-red-600">
            {servicesError ||
              agendaError ||
              suggestionError ||
              t('errors.genericSelectedService')}
          </p>
          <button
            type="button"
            onClick={() => router.push(toLocalizedPath('/book/services'))}
            className="text-primary text-xs underline"
          >
            {t('noServiceSelected.button')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-6">
        <BookingSuggestionsGrid
          bookingAddress={bookingAddress}
          bookingLoading={bookingLoading}
          loadingSuggestions={loadingSuggestions}
          locale={locale}
          onBookSlot={handleOpenSuggestionConfirm}
          onSeeAllSlots={handleSeeAllSlots}
          selectedService={selectedService}
          suggestions={suggestions}
          t={t}
        />
      </div>
      <BookingSuggestionConfirmDialog
        loading={bookingLoading}
        locale={locale}
        onConfirm={handleConfirmSuggestion}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        slot={pendingSuggestion}
        t={t}
      />
    </main>
  );
}
