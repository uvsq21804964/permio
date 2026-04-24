'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { type ProfileTranslator } from '@/components/profile/profile-shared';
import { useGooglePlacesAutocomplete } from '@/lib/client/hooks/useGooglePlacesAutocomplete';
import {
  deleteMyAccount,
  getProfile,
  updateProfile,
} from '@/lib/client/api/profile-client';
import {
  mapProfileAddressToDetails,
  matchesFormattedAddress,
  type AddressDetails,
} from '@/lib/client/utils/address';
import { isGoogleMapsPlacesReady } from '@/lib/client/utils/google-maps';
import type { MyProfileUser } from '@/lib/client/api/me-client';

export type UserProfile = MyProfileUser;

export type AddressDraft = {
  address_label: string;
  formatted_address: string;
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  country: string;
  country_code: string;
};

function buildAddressDraft(profile: UserProfile): AddressDraft {
  return {
    address_label: profile.address_label || '',
    formatted_address: profile.formatted_address || '',
    street: profile.street || '',
    street_number: profile.street_number || '',
    postal_code: profile.postal_code || '',
    city: profile.city || '',
    country: profile.country || '',
    country_code: profile.country_code || '',
  };
}

export function useProfilePageState() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const clerk = useClerk();
  const { user, isLoaded: isUserLoaded } = useUser();

  const accessToastShownRef = useRef(false);
  const formattedAddressRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [draftAddress, setDraftAddress] = useState<AddressDraft>({
    address_label: '',
    formatted_address: '',
    street: '',
    street_number: '',
    postal_code: '',
    city: '',
    country: '',
    country_code: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null,
  );
  const [isMapsReady, setIsMapsReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const translator = t as unknown as ProfileTranslator;

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProfile({
        fallbackMessage: t('errors.loadProfile'),
      });
      setProfile(data.user);
    } catch (nextError: any) {
      console.error(nextError);
      setError(nextError?.message || t('errors.loadProfile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const copyJoinCode = useCallback(async () => {
    const code = profile?.joinCode || '';
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      alert(code);
    }
  }, [profile?.joinCode]);

  useEffect(() => {
    if (isGoogleMapsPlacesReady()) {
      setIsMapsReady(true);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const required = searchParams.get('reason') === 'subscription';
    if (!required || !profile || accessToastShownRef.current) {
      return;
    }

    accessToastShownRef.current = true;

    if (profile.role === 'instructor') {
      toast.error(t('toasts.subscriptionRequired.title'), {
        description: t('toasts.subscriptionRequired.descriptionInstructor'),
      });
    } else {
      toast.error(t('toasts.subscriptionRequired.title'), {
        description: t('toasts.subscriptionRequired.descriptionStudent'),
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('required');
    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, profile, router, searchParams, t]);

  useGooglePlacesAutocomplete({
    enabled: addressModalOpen && isMapsReady,
    inputRef: formattedAddressRef,
    fallbackFormattedAddress: draftAddress.formatted_address,
    onSelect: (address) => {
      setDraftAddress((previous) => ({
        ...previous,
        formatted_address: address.formattedAddress,
        street: address.street,
        street_number: address.streetNumber,
        postal_code: address.postalCode,
        city: address.city,
        country: address.country,
        country_code: address.countryCode,
      }));
      setSelectedAddress(address);
      setAddressError(null);
    },
    onInvalidSelection: () => {
      setAddressError(t('errors.geocodeFail'));
      setSelectedAddress(null);
    },
  });

  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm(t('delete.confirmPrompt'))) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);
      setSuccessMessage(null);

      await deleteMyAccount({
        fallbackMessage: t('errors.deleteFailed'),
      });

      window.location.href = `/${locale}/home`;
    } catch (nextError: any) {
      console.error(nextError);
      setDeleteError(nextError?.message || t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }, [locale, t]);

  const openNameModal = useCallback(() => {
    if (!profile) return;

    setDraftName(profile.name || '');
    setNameError(null);
    setSuccessMessage(null);
    setNameModalOpen(true);
  }, [profile]);

  const closeNameModal = useCallback(() => {
    if (savingName) return;
    setNameModalOpen(false);
  }, [savingName]);

  const handleSaveName = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!profile) return;

      if (!draftName.trim()) {
        setNameError(t('errors.nameEmpty'));
        return;
      }

      try {
        setSavingName(true);
        setNameError(null);

        const data = await updateProfile(
          {
            name: draftName.trim(),
            planned_minutes: profile.planned_minutes,
            address_label: profile.address_label,
            formatted_address: profile.formatted_address,
            street: profile.street,
            street_number: profile.street_number,
            postal_code: profile.postal_code,
            city: profile.city,
            country: profile.country,
            country_code: profile.country_code,
          },
          {
            fallbackMessage: t('errors.updateNameFailed'),
          },
        );

        setProfile(data.user);
        setSuccessMessage(t('success.nameUpdated'));
        setNameModalOpen(false);
      } catch (nextError: any) {
        console.error(nextError);
        setNameError(nextError?.message || t('errors.updateNameFailed'));
      } finally {
        setSavingName(false);
      }
    },
    [draftName, profile, t],
  );

  const openAddressModal = useCallback(() => {
    if (!profile) return;

    setDraftAddress(buildAddressDraft(profile));
    setAddressError(null);
    setSuccessMessage(null);
    setSelectedAddress(mapProfileAddressToDetails(profile));
    setAddressModalOpen(true);
  }, [profile]);

  const closeAddressModal = useCallback(() => {
    if (savingAddress) return;
    setAddressModalOpen(false);
  }, [savingAddress]);

  const handleAddressDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setDraftAddress((previous) => ({
        ...previous,
        [name]: value,
      }));

      if (name === 'formatted_address') {
        setSelectedAddress((current) => {
          if (!current) return null;
          return matchesFormattedAddress(current, value) ? current : null;
        });
      }
    },
    [],
  );

  const handleSaveAddress = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!profile) return;

      if (!draftAddress.formatted_address.trim()) {
        setAddressError(t('errors.addressEmpty'));
        return;
      }

      if (!selectedAddress) {
        setAddressError(t('errors.addressNeedSuggestion'));
        return;
      }

      try {
        setSavingAddress(true);
        setAddressError(null);

        const data = await updateProfile(
          {
            name: profile.name ?? '',
            planned_minutes: profile.planned_minutes,
            address_label: draftAddress.address_label || null,
            formatted_address: draftAddress.formatted_address.trim(),
            street: draftAddress.street || null,
            street_number: draftAddress.street_number || null,
            postal_code: draftAddress.postal_code || null,
            city: draftAddress.city || null,
            country: draftAddress.country || null,
            country_code: draftAddress.country_code || null,
            lat: selectedAddress.lat,
            lng: selectedAddress.lng,
            google_place_id: selectedAddress.googlePlaceId ?? null,
            raw_input: draftAddress.formatted_address.trim(),
          },
          {
            fallbackMessage: t('errors.updateAddressFailed'),
          },
        );

        setProfile(data.user);
        setSuccessMessage(t('success.addressUpdated'));
        setAddressModalOpen(false);
        setSelectedAddress(null);
      } catch (nextError: any) {
        console.error(nextError);
        setAddressError(nextError?.message || t('errors.updateAddressFailed'));
      } finally {
        setSavingAddress(false);
      }
    },
    [draftAddress, profile, selectedAddress, t],
  );

  const displayedMapAddress = profile
    ? selectedAddress ?? mapProfileAddressToDetails(profile)
    : selectedAddress;

  const openProfilePhotoSettings = useCallback(() => {
    if (!isUserLoaded) {
      return;
    }

    clerk.openUserProfile();
  }, [clerk, isUserLoaded]);

  return {
    addressError,
    addressModalOpen,
    closeAddressModal,
    closeNameModal,
    copied,
    copyJoinCode,
    deleteError,
    deleting,
    displayedMapAddress,
    draftAddress,
    draftName,
    error,
    formattedAddressRef,
    handleAddressDraftChange,
    handleDeleteAccount,
    handleSaveAddress,
    handleSaveName,
    isMapsReady,
    loadProfile,
    loading,
    nameError,
    nameModalOpen,
    onMapsLoadError: (nextError: unknown) => {
      console.error('Google Maps script load error', nextError);
      setAddressError(t('errors.mapsLoad'));
    },
    onMapsReady: () => setIsMapsReady(true),
    openAddressModal,
    openNameModal,
    openProfilePhotoSettings,
    profile,
    profileImageUrl: user?.imageUrl ?? null,
    savingAddress,
    savingName,
    selectedAddress,
    setDraftName,
    t,
    translator,
    successMessage,
  };
}
