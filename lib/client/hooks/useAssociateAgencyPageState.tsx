'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useOrganizationList, useUser } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';

import { isHttpError } from '@/lib/client/api/request';
import {
  associateToAgency,
  getAccountRecordStatus,
} from '@/lib/client/api/profile-client';
import { useGooglePlacesAutocomplete } from '@/lib/client/hooks/useGooglePlacesAutocomplete';
import {
  matchesFormattedAddress,
  type AddressDetails,
} from '@/lib/client/utils/address';
import { isGoogleMapsPlacesReady } from '@/lib/client/utils/google-maps';
import { devLogger } from '@/lib/shared/dev-logger';
import { parseClientOnboardingInviteFromSearchParams } from '@/src/lib/client-onboarding-invite';
import {
  clearStoredClientOnboardingInvite,
  readStoredClientOnboardingInvite,
} from '@/src/lib/client-onboarding-invite-storage';

export type AssociateAgencySuccessData = {
  organizationId: string;
  agencyId?: string;
  agencyName?: string;
};

type AssociateAgencyMode = 'trainer' | 'client' | null;
type TrainerStep = 'address' | 'availability';
type AgencyTrainerPreview = {
  agencyName?: string | null;
  trainerImageUrl?: string | null;
  trainerName?: string | null;
  trainerStats?: {
    averageRating?: number | null;
    clientsCount: number;
    coursesCount: number;
    reviewsCount: number;
  } | null;
  trainerReviews?: Array<{
    clientName?: string | null;
    comment?: string | null;
    id: string;
    rating: number;
  }>;
};

function withLocaleClient(path: string, locale: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.startsWith(`/${locale}/`)
    ? normalized
    : `/${locale}${normalized}`;
}

export function useAssociateAgencyPageState(params?: {
  onSuccess?: (data: AssociateAgencySuccessData) => void;
}) {
  const { onSuccess } = params ?? {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('associateAgency');
  const { setActive } = useOrganizationList();
  const { orgId } = useAuth();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [ignoreClientInvite, setIgnoreClientInvite] = useState(false);

  const clientInvite = useMemo(() => {
    if (ignoreClientInvite) {
      return {
        agencyCode: '',
        agencyName: null,
        isClientInvite: false,
      };
    }

    const fromSearchParams =
      parseClientOnboardingInviteFromSearchParams(searchParams);
    if (fromSearchParams.isClientInvite) {
      return fromSearchParams;
    }

    return readStoredClientOnboardingInvite() ?? fromSearchParams;
  }, [ignoreClientInvite, searchParams]);

  const [checkingDb, setCheckingDb] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<AssociateAgencyMode>(
    clientInvite.isClientInvite ? 'client' : null,
  );
  const [trainerStep, setTrainerStep] = useState<TrainerStep>('address');

  const [code, setCode] = useState(clientInvite.agencyCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencyPreview, setAgencyPreview] = useState<AgencyTrainerPreview | null>(
    null,
  );
  const [agencyPreviewLoading, setAgencyPreviewLoading] = useState(false);

  const [trainerAgencyName, setTrainerAgencyName] = useState('');
  const [trainerPhoneCountryCode, setTrainerPhoneCountryCode] = useState(
    locale.startsWith('fr') ? '+33' : '+1',
  );
  const [trainerPhoneNumber, setTrainerPhoneNumber] = useState('');
  const [trainerWebsiteUrl, setTrainerWebsiteUrl] = useState('');

  const [isMapsReady, setIsMapsReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null,
  );

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const displayName = fullName || firstName || '';
  const redirectUrl = withLocaleClient('/home', locale);
  const postClientAssociationPath = withLocaleClient(
    clientInvite.isClientInvite ? '/book/services' : '/myweek',
    locale,
  );

  useEffect(() => {
    if (isGoogleMapsPlacesReady()) {
      setIsMapsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!clientInvite.isClientInvite) {
      return;
    }

    setMode('client');
    setCode(clientInvite.agencyCode);
  }, [clientInvite.agencyCode, clientInvite.isClientInvite]);

  useEffect(() => {
    if (mode !== 'client') {
      setAgencyPreview(null);
      setAgencyPreviewLoading(false);
      return;
    }

    if (!isUserLoaded || !isSignedIn) {
      setAgencyPreviewLoading(false);
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setAgencyPreview(null);
      setAgencyPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setAgencyPreviewLoading(true);

      try {
        const response = await fetch(
          `/api/agency/preview?code=${encodeURIComponent(normalizedCode)}`,
          {
            credentials: 'include',
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setAgencyPreview(null);
          return;
        }

        const data = (await response.json()) as {
          agency?: { name?: string | null };
          trainer?:
            | {
                imageUrl?: string | null;
                name?: string | null;
                reviews?: Array<{
                  clientName?: string | null;
                  comment?: string | null;
                  id: string;
                  rating: number;
                }>;
                stats?: {
                  averageRating?: number | null;
                  clientsCount?: number;
                  coursesCount?: number;
                  reviewsCount?: number;
                };
              }
            | null;
        };

        setAgencyPreview({
          agencyName: data.agency?.name ?? null,
          trainerImageUrl: data.trainer?.imageUrl ?? null,
          trainerName: data.trainer?.name ?? null,
          trainerReviews: data.trainer?.reviews ?? [],
          trainerStats: {
            averageRating: data.trainer?.stats?.averageRating ?? null,
            clientsCount: data.trainer?.stats?.clientsCount ?? 0,
            coursesCount: data.trainer?.stats?.coursesCount ?? 0,
            reviewsCount: data.trainer?.stats?.reviewsCount ?? 0,
          },
        });
      } catch (previewError) {
        if ((previewError as Error).name === 'AbortError') {
          return;
        }

        setAgencyPreview(null);
      } finally {
        if (!controller.signal.aborted) {
          setAgencyPreviewLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [code, isSignedIn, isUserLoaded, locale, mode]);

  useEffect(() => {
    if (!isUserLoaded) {
      return;
    }

    if (!isSignedIn) {
      setCheckingDb(false);
      return;
    }

    const run = async () => {
      try {
        const data = await getAccountRecordStatus({
          fallbackMessage: 'Failed to load account status',
        });

        const hasConfiguredAccount =
          !!data?.exists && !!data?.user?.agencyId && !!data?.user?.role;

        if (hasConfiguredAccount && orgId) {
          setBlockingMessage(
            locale.startsWith('fr')
              ? 'Votre compte est deja configure. Redirection vers votre semaine...'
              : 'Your account is already set up. Redirecting to your week...',
          );
          setRedirecting(true);
          router.replace(postClientAssociationPath);
          return;
        }
      } catch {
        // If it fails, don't block onboarding.
      } finally {
        setCheckingDb(false);
      }
    };

    void run();
  }, [
    isSignedIn,
    isUserLoaded,
    locale,
    orgId,
    postClientAssociationPath,
    router,
  ]);

  const greetingNode = useMemo<ReactNode>(() => {
    if (mode === 'client') {
      return locale.startsWith('fr') ? (
        <>
          Votre chien a hate
          <br />
          Trouvons son prochain educateur !
        </>
      ) : (
        <>
          Your dog can&apos;t wait
          <br />
          Let&apos;s find the next trainer!
        </>
      );
    }

    if (mode === 'trainer') {
      if (trainerStep === 'address') {
        return locale.startsWith('fr') ? (
          <>
            Cote pro
            <br />
            Parlez-nous de votre activite.
          </>
        ) : (
          <>
            Pro mode
            <br />
            Tell us about your activity.
          </>
        );
      }

      return locale.startsWith('fr') ? (
        <>
          Parfait
          <br />
          Indiquez vos disponibilités
        </>
      ) : (
        <>
          Perfect
          <br />
          Now, let&apos;s choose your work schedule!
        </>
      );
    }

    return null;
  }, [locale, mode, trainerStep]);

  const resetAll = () => {
    setMode(clientInvite.isClientInvite ? 'client' : null);
    setTrainerStep('address');
    setCode(clientInvite.agencyCode);
    setLoading(false);
    setError(null);
    setTrainerAgencyName('');
    setTrainerPhoneCountryCode(locale.startsWith('fr') ? '+33' : '+1');
    setTrainerPhoneNumber('');
    setTrainerWebsiteUrl('');
    setAddressInput('');
    setSelectedAddress(null);
  };

  const handleExitClientInviteFlow = () => {
    clearStoredClientOnboardingInvite();
    setIgnoreClientInvite(true);
    setMode(null);
    setTrainerStep('address');
    setCode('');
    setLoading(false);
    setError(null);
    setAgencyPreview(null);
    setAgencyPreviewLoading(false);
    setTrainerAgencyName('');
    setTrainerPhoneCountryCode(locale.startsWith('fr') ? '+33' : '+1');
    setTrainerPhoneNumber('');
    setTrainerWebsiteUrl('');
    setAddressInput('');
    setSelectedAddress(null);
  };

  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    setSelectedAddress((current) => {
      if (!current) {
        return null;
      }

      return matchesFormattedAddress(current, value) ? current : null;
    });
  };

  useGooglePlacesAutocomplete({
    enabled:
      isMapsReady &&
      (mode === 'client' || (mode === 'trainer' && trainerStep === 'address')),
    inputRef: addressInputRef,
    fallbackFormattedAddress: addressInput,
    onSelect: (address) => {
      setAddressInput(address.formattedAddress);
      setSelectedAddress(address);
      setError(null);
    },
    onInvalidSelection: () => {
      setError(t('error.geoFailed'));
      setSelectedAddress(null);
    },
  });

  const handleSubmitClient = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setError(t('error.codeRequired'));
      return;
    }

    if (!selectedAddress) {
      setError(t('error.addressRequired'));
      return;
    }

    setLoading(true);
    try {
      const data = await associateToAgency(
        {
          code: normalizedCode,
          locale,
          address: selectedAddress,
          rawInput: addressInput,
        },
        {
          fallbackMessage: t('error.unknown'),
        },
      );

      if (data.organizationId && setActive) {
        await setActive({ organization: data.organizationId });
      }

      clearStoredClientOnboardingInvite();
      onSuccess?.(data);
      router.push(postClientAssociationPath);
    } catch (nextError: any) {
      if (isHttpError<{ details?: string }>(nextError)) {
        setError(
          nextError.data?.details || nextError.message || t('error.unknown'),
        );
      } else {
        setError(nextError?.details || nextError?.message || t('error.unknown'));
      }
    } finally {
      setLoading(false);
    }
  };

  const validateTrainerStep = () => {
    if (!trainerAgencyName.trim()) {
      setError(
        locale.startsWith('fr')
          ? "Veuillez renseigner le nom de votre entreprise."
          : 'Please provide the company name.',
      );
      return false;
    }

    if (!trainerWebsiteUrl.trim()) {
      setError(
        locale.startsWith('fr')
          ? "Veuillez renseigner l'URL de votre site."
          : 'Please provide your website URL.',
      );
      return false;
    }

    if (!trainerPhoneCountryCode.trim()) {
      setError(
        locale.startsWith('fr')
          ? "Veuillez choisir l'indicatif du pays."
          : 'Please choose a country calling code.',
      );
      return false;
    }

    if (trainerPhoneNumber.replace(/\D/g, '').length < 6) {
      setError(
        locale.startsWith('fr')
          ? 'Veuillez renseigner un numero de telephone valide.'
          : 'Please provide a valid phone number.',
      );
      return false;
    }

    if (!selectedAddress || !addressInput.trim()) {
      setError(t('error.addressRequired'));
      return false;
    }

    return true;
  };

  const handleSelectClientMode = () => {
    setError(null);
    setMode('client');
    setTrainerStep('address');
    setTrainerAgencyName('');
    setTrainerPhoneCountryCode(locale.startsWith('fr') ? '+33' : '+1');
    setTrainerPhoneNumber('');
    setTrainerWebsiteUrl('');
    setAddressInput('');
    setSelectedAddress(null);
    setCode(clientInvite.agencyCode);
  };

  const handleSelectTrainerMode = () => {
    setError(null);
    setMode('trainer');
    setTrainerStep('address');
    setCode('');
    setLoading(false);
    setTrainerPhoneCountryCode(locale.startsWith('fr') ? '+33' : '+1');
    setTrainerPhoneNumber('');
    setAddressInput('');
    setSelectedAddress(null);
  };

  const handleContinueTrainerAddress = () => {
    setError(null);
    if (!validateTrainerStep()) {
      return;
    }

    setTrainerStep('availability');
  };

  const handleBackToTrainerAddress = () => {
    setTrainerStep('address');
  };

  const handleTrainerOnboarded = async (data: { organizationId?: string }) => {
    if (data.organizationId && setActive) {
      await setActive({ organization: data.organizationId });
    }

    clearStoredClientOnboardingInvite();
    router.push(`/${locale}/myweek`);
  };

  const handleMapsReady = () => {
    setIsMapsReady(true);
  };

  const handleMapsLoadError = (nextError: unknown) => {
    devLogger.error('Erreur de chargement du script Google Maps', nextError);
    setError(t('error.mapsScript'));
  };

  const canSubmitClient =
    !loading && code.trim().length > 0 && !!selectedAddress && !!addressInput.trim();
  const canContinueTrainerAddress =
    !!selectedAddress &&
    !!addressInput.trim() &&
    !!trainerAgencyName.trim() &&
    !!trainerWebsiteUrl.trim();
  const showBlockingScreen = !isUserLoaded || checkingDb || redirecting;

  return {
    addressInput,
    agencyPreview,
    agencyPreviewLoading,
    addressInputRef,
    blockingMessage,
    canContinueTrainerAddress,
    canSubmitClient,
    checkingDb,
    code,
    clientInviteAgencyName: clientInvite.agencyName,
    clientInviteLocked: clientInvite.isClientInvite,
    displayName,
    email,
    error,
    greetingNode,
    handleAddressInputChange,
    handleBackToTrainerAddress,
    handleContinueTrainerAddress,
    handleExitClientInviteFlow,
    handleMapsLoadError,
    handleMapsReady,
    handleSelectClientMode,
    handleSelectTrainerMode,
    handleSubmitClient,
    handleTrainerOnboarded,
    isMapsReady,
    isUserLoaded,
    locale,
    loading,
    mode,
    redirectUrl,
    resetAll,
    selectedAddress,
    setCode,
    setTrainerAgencyName,
    setTrainerPhoneCountryCode,
    setTrainerPhoneNumber,
    setTrainerWebsiteUrl,
    showBlockingScreen,
    trainerAgencyName,
    trainerPhoneCountryCode,
    trainerPhoneNumber,
    trainerStep,
    trainerWebsiteUrl,
    t,
  };
}
