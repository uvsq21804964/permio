'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganizationList, useUser } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';

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

export type AssociateAgencySuccessData = {
  organizationId: string;
  agencyId?: string;
  agencyName?: string;
};

type AssociateAgencyMode = 'trainer' | 'client' | null;
type TrainerStep = 'address' | 'availability';

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
  const locale = useLocale();
  const t = useTranslations('associateAgency');
  const { setActive } = useOrganizationList();
  const { orgId } = useAuth();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();

  const [checkingDb, setCheckingDb] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<AssociateAgencyMode>(null);
  const [trainerStep, setTrainerStep] = useState<TrainerStep>('address');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trainerAgencyName, setTrainerAgencyName] = useState('');
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

  useEffect(() => {
    if (isGoogleMapsPlacesReady()) {
      setIsMapsReady(true);
    }
  }, []);

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
          router.replace(`/${locale}/myweek`);
          return;
        }
      } catch {
        // If it fails, don't block onboarding.
      } finally {
        setCheckingDb(false);
      }
    };

    void run();
  }, [isSignedIn, isUserLoaded, locale, orgId, router]);

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
    setMode(null);
    setTrainerStep('address');
    setCode('');
    setLoading(false);
    setError(null);
    setTrainerAgencyName('');
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

      onSuccess?.(data);
      router.push(`/${locale}/myweek`);
    } catch (nextError: any) {
      setError(nextError?.details || nextError?.message || t('error.unknown'));
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
    setTrainerWebsiteUrl('');
    setAddressInput('');
    setSelectedAddress(null);
    setCode('');
  };

  const handleSelectTrainerMode = () => {
    setError(null);
    setMode('trainer');
    setTrainerStep('address');
    setCode('');
    setLoading(false);
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
    addressInputRef,
    blockingMessage,
    canContinueTrainerAddress,
    canSubmitClient,
    checkingDb,
    code,
    displayName,
    email,
    error,
    greetingNode,
    handleAddressInputChange,
    handleBackToTrainerAddress,
    handleContinueTrainerAddress,
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
    setTrainerWebsiteUrl,
    showBlockingScreen,
    trainerAgencyName,
    trainerStep,
    trainerWebsiteUrl,
    t,
  };
}
