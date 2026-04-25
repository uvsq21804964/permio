'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getWeeklyAvailabilities,
  replaceWeeklyAvailabilities,
} from '@/lib/client/api/availabilities-client';
import { completeTrainerOnboarding } from '@/lib/client/api/profile-client';
import {
  isAvailabilityDraftDirty,
  type AvailabilityDraftLike,
} from '@/lib/client/utils/availability-editor';
import { mergeAvailabilities } from '@/lib/client/utils/availability-time';
import type { AddressDetails } from '@/lib/client/utils/address';

type OnboardingPayload = {
  address: AddressDetails;
  rawInput: string;
  agencyName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  websiteUrl: string;
};

type Options<TDraft extends AvailabilityDraftLike> = {
  locale: string;
  onboarding?: OnboardingPayload | null;
  onOnboarded?: (data: { organizationId?: string }) => void;
};

export function useEditableWeeklyAvailabilityDraft<
  TDraft extends AvailabilityDraftLike,
>({ locale, onboarding, onOnboarded }: Options<TDraft>) {
  const [saved, setSaved] = useState<TDraft[]>([]);
  const [draft, setDraft] = useState<TDraft[]>([]);
  const [loading, setLoading] = useState<boolean>(!onboarding);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAvailabilities = useCallback(async () => {
    if (onboarding) {
      setLoading(false);
      setSaved([]);
      setDraft([]);
      return;
    }

    setLoading(true);
    try {
      const list = await getWeeklyAvailabilities({
        fallbackMessage: locale.startsWith('fr')
          ? 'Impossible de charger vos disponibilités.'
          : 'Unable to load your availability.',
      });

      const merged = mergeAvailabilities(list) as TDraft[];
      setSaved(merged);
      setDraft(merged);
    } catch {
      setSaved([]);
      setDraft([]);
    } finally {
      setLoading(false);
    }
  }, [locale, onboarding]);

  useEffect(() => {
    void fetchAvailabilities();
  }, [fetchAvailabilities]);

  const dirty = useMemo(
    () => isAvailabilityDraftDirty(saved, draft),
    [draft, saved]
  );

  const resetDraft = useCallback(() => {
    setDraft(saved);
    setError('');
  }, [saved]);

  const saveAll = useCallback(async () => {
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
        return false;
      }

      const payloadAvailabilities = normalizedDraft.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
      }));

      if (onboarding) {
        const data = await completeTrainerOnboarding(
          {
            agencyName: onboarding.agencyName,
            phoneCountryCode: onboarding.phoneCountryCode,
            phoneNumber: onboarding.phoneNumber,
            websiteUrl: onboarding.websiteUrl,
            address: onboarding.address,
            rawInput: onboarding.rawInput,
            availabilities: payloadAvailabilities,
          },
          {
            fallbackMessage: locale.startsWith('fr')
              ? "Impossible d'enregistrer vos disponibilités."
              : 'Unable to save your availability.',
          }
        );

        onOnboarded?.({
          organizationId: data?.organizationId || data?.clerkOrgId,
        });
        return true;
      }

      await replaceWeeklyAvailabilities(
        { availabilities: payloadAvailabilities },
        {
          fallbackMessage: locale.startsWith('fr')
            ? "Impossible d'enregistrer vos disponibilités."
            : 'Unable to save your availability.',
        }
      );

      await fetchAvailabilities();
      return true;
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : locale.startsWith('fr')
          ? "Impossible d'enregistrer vos disponibilités."
          : 'Unable to save your availability.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, fetchAvailabilities, locale, onOnboarded, onboarding]);

  return {
    draft,
    dirty,
    error,
    fetchAvailabilities,
    loading,
    resetDraft,
    saved,
    saveAll,
    saving,
    setDraft,
    setError,
  };
}
