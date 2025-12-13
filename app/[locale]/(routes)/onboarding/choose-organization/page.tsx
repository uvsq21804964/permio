'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationList, SignOutButton, useUser } from '@clerk/nextjs';
import Script from 'next/script';
import { useTranslations, useLocale } from 'next-intl';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import Link from 'next/link';
import Image from 'next/image';

import AssociateAgencyAvailability from '@/components/associate-agency-availability';

type Props = {
  onSuccess?: (data: {
    organizationId: string;
    agencyId?: string;
    agencyName?: string;
  }) => void;
  className?: string;
};

type AddressDetails = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  googlePlaceId?: string;
};

declare global {
  interface Window {
    google: any;
  }
}

function extractComponent(
  components: any[] | undefined,
  type: string,
  useShort?: boolean
): string {
  if (!components) return '';
  const found = components.find((c) => c.types?.includes(type));
  if (!found) return '';
  return useShort ? found.short_name ?? '' : found.long_name ?? '';
}

const withLocaleClient = (path: string, locale: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(`/${locale}/`) ? p : `/${locale}${p}`;
};

export default function AssociateAgency({ onSuccess, className }: Props) {
  const logo = '/IconeSansFond.png';
  const locale = useLocale();
  const redirectUrl = withLocaleClient('/home', locale);

  const t = useTranslations('associateAgency');
  const router = useRouter();
  const { setActive } = useOrganizationList();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Mode (client / trainer) + step trainer
  const [mode, setMode] = useState<'trainer' | 'client' | null>(null);
  const [trainerStep, setTrainerStep] = useState<'address' | 'availability'>(
    'address'
  );

  // Client form
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google address (used by client + trainer)
  const [isMapsReady, setIsMapsReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null
  );
  const autocompleteRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ✅ Si le script est déjà chargé, on ne dépend pas de onLoad()
    if (window.google?.maps?.places?.Autocomplete) {
      setIsMapsReady(true);
    }
  }, []);

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const displayName = fullName || firstName || '';

  const greetingNode = useMemo(() => {
    if (mode === 'client') {
      return locale.startsWith('fr') ? (
        <>
          Votre chien a hâte 🐾
          <br />
          Trouvons son prochain éducateur !
        </>
      ) : (
        <>
          Your dog can't wait 🐾
          <br />
          Let's find his next trainer !
        </>
      );
    }
    if (mode === 'trainer') {
      if (trainerStep === 'address') {
        return locale.startsWith('fr') ? (
          <>
            Côté pro ✨
            <br />
            Dites-nous d'où vous vous déplacerez.
          </>
        ) : (
          <>
            Pro mode ✨
            <br />
            Tell us where you will travel from !
          </>
        );
      }
      return locale.startsWith('fr') ? (
        <>
          Parfait ✅
          <br />
          Indiquez vos disponibilités (lun → dim).
        </>
      ) : (
        <>
          Perfect ✅
          <br />
          Now, let's choose your work schedule !
        </>
      );
    }
    return null;
  }, [mode, trainerStep, locale]);

  // Google places init (when we show an address input)
  useEffect(() => {
    const needAddressInput =
      mode === 'client' || (mode === 'trainer' && trainerStep === 'address');
    if (!needAddressInput) return;

    if (!isMapsReady) return;
    if (!addressInputRef.current) return;

    const AutocompleteCtor = window.google?.maps?.places?.Autocomplete;
    if (!AutocompleteCtor) return;

    // ✅ Cleanup ancienne instance si on ré-init (changement de mode/step)
    if (autocompleteRef.current) {
      window.google?.maps?.event?.clearInstanceListeners(
        autocompleteRef.current
      );
      autocompleteRef.current = null;
    }

    const ac = new AutocompleteCtor(addressInputRef.current, {
      types: ['address'],
      fields: [
        'formatted_address',
        'geometry',
        'address_components',
        'place_id',
      ],
    });

    autocompleteRef.current = ac;

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace();

      if (!place.geometry || !place.geometry.location) {
        setError(t('error.geoFailed'));
        setSelectedAddress(null);
        return;
      }

      const comps = place.address_components;
      const currentInputValue = addressInputRef.current?.value || '';

      const addr: AddressDetails = {
        formattedAddress: place.formatted_address ?? currentInputValue,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        street: extractComponent(comps, 'route'),
        streetNumber: extractComponent(comps, 'street_number'),
        postalCode: extractComponent(comps, 'postal_code'),
        city:
          extractComponent(comps, 'locality') ||
          extractComponent(comps, 'postal_town'),
        country: extractComponent(comps, 'country'),
        countryCode: extractComponent(comps, 'country', true),
        googlePlaceId: place.place_id,
      };

      setAddressInput(addr.formattedAddress);
      setSelectedAddress(addr);
      setError(null);
    });

    return () => {
      // retire proprement le listener + l'instance
      window.google?.maps?.event?.removeListener?.(listener);
      window.google?.maps?.event?.clearInstanceListeners(ac);
      if (autocompleteRef.current === ac) autocompleteRef.current = null;
    };
  }, [mode, trainerStep, isMapsReady, t]);

  // Client submit (association)
  const onSubmitClient = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError(t('error.codeRequired'));
      return;
    }
    if (!selectedAddress) {
      setError(t('error.addressRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agency/association', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: normalized,
          address: {
            formattedAddress: selectedAddress.formattedAddress,
            lat: selectedAddress.lat,
            lng: selectedAddress.lng,
            street: selectedAddress.street,
            streetNumber: selectedAddress.streetNumber,
            postalCode: selectedAddress.postalCode,
            city: selectedAddress.city,
            country: selectedAddress.country,
            countryCode: selectedAddress.countryCode,
            googlePlaceId: selectedAddress.googlePlaceId,
            rawInput: addressInput,
          },
        }),
      });

      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json')
        ? await res.json()
        : await res.text().then((txt) => {
            throw new Error(
              txt?.slice(0, 200) || `Non-JSON response (status ${res.status})`
            );
          });

      if (!res.ok) {
        throw new Error(
          data?.error || `Association failed (status ${res.status})`
        );
      }

      if (data.organizationId && setActive) {
        await setActive({ organization: data.organizationId });
      }

      onSuccess?.(data);
      router.push(`/${locale}/myweek`);
    } catch (e: any) {
      setError(e?.details || e?.message || t('error.unknown'));
    } finally {
      setLoading(false);
    }
  };

  const canSubmitClient =
    !loading &&
    code.trim().length > 0 &&
    !!selectedAddress &&
    !!addressInput.trim();

  const canContinueTrainerAddress = !!selectedAddress && !!addressInput.trim();

  const ModeChip = ({
    value,
    label,
  }: {
    value: 'client' | 'trainer';
    label: string;
  }) => {
    const active = mode === value;
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode(value);
          if (value === 'trainer') setTrainerStep('address');
        }}
        className={[
          'rounded-full px-3 py-1.5 text-[11px] md:text-sm font-semibold transition whitespace-nowrap',
          active
            ? 'bg-primary text-white shadow-sm'
            : 'bg-white/80 text-primary border border-primary/30 hover:bg-primary hover:text-white',
        ].join(' ')}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-[#f9ffc6]/80 min-h-screen">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-black/10 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
          <Link
            href={`/${locale}/home`}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="relative h-7 w-7 shrink-0 md:h-8 md:w-8">
              <Image
                src={logo}
                alt="MagicHango"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </span>
            <span className="truncate text-sm md:text-base font-semibold tracking-tight">
              MagicHango
            </span>
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <SignOutButton signOutOptions={{ redirectUrl }}>
              <button
                type="button"
                className="text-[11px] md:text-sm font-medium text-white/80 hover:text-white transition"
              >
                Déconnexion
              </button>
            </SignOutButton>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="pt-14 md:pt-16">
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setIsMapsReady(true)}
          onError={(e) => {
            console.error('Erreur de chargement du script Google Maps', e);
            setError(t('error.mapsScript'));
          }}
        />

        {/* Screen 1: selection */}
        {mode === null ? (
          <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
            <div className="w-full max-w-xl text-center">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-black">
                {isUserLoaded && displayName ? (
                  <>
                    Bienvenue{' '}
                    <span className="text-primary">{displayName}</span>
                  </>
                ) : (
                  <>Bienvenue</>
                )}
              </h1>

              <p className="mt-2 text-black/70">
                {locale.startsWith('fr')
                  ? 'Que souhaitez-vous faire ?'
                  : 'What would you like to do?'}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('client');
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm md:text-base font-semibold
                    bg-primary text-white shadow-sm border border-primary
                    hover:bg-white hover:text-primary transition whitespace-nowrap"
                >
                  {locale.startsWith('fr')
                    ? 'Je veux entraîner mon chien'
                    : 'I want to train my dog'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('trainer');
                    setTrainerStep('address');
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-primary bg-white/95 px-5 py-2.5 text-sm md:text-base font-semibold
                    text-primary shadow-sm
                    hover:bg-primary hover:text-white transition whitespace-nowrap"
                >
                  {locale.startsWith('fr')
                    ? 'Je suis éducateur canin'
                    : "I'm a dog trainer"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={[
              'mx-auto px-4 py-10',
              mode === 'trainer' && trainerStep === 'availability'
                ? 'max-w-6xl' // ✅ plus large
                : 'max-w-2xl',
            ].join(' ')}
          >
            {/* Minimal header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-lg md:text-xl font-bold text-black">
                  {greetingNode}
                </div>

                {isUserLoaded && (displayName || email) ? (
                  <div className="text-sm text-black/55 truncate">
                    {[displayName, email].filter(Boolean).join(' · ')}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {/* <ModeChip
                  value="client"
                  label={locale.startsWith('fr') ? 'Réserver' : 'Book'}
                />
                <ModeChip
                  value="trainer"
                  label={locale.startsWith('fr') ? 'Éducateur' : 'Trainer'}
                /> */}
                {trainerStep === 'address' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode(null);
                      setTrainerStep('address');
                    }}
                    className="ml-1 text-sm text-black/60 hover:text-black underline underline-offset-4 whitespace-nowrap"
                  >
                    {locale.startsWith('fr')
                      ? 'Retourner au choix des rôles'
                      : 'Go back to selection'}
                  </button>
                )}
              </div>
            </div>

            {/* CLIENT: code + address */}
            {mode === 'client' ? (
              <form
                onSubmit={onSubmitClient}
                className={[
                  'mt-6 rounded-3xl bg-white/95 shadow-[0_18px_60px_rgba(0,0,0,0.10)] border border-black/10 p-5 md:p-6',
                  className,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="agency_code"
                      className="text-sm font-medium text-black/80"
                    >
                      {t('label.code')}
                    </label>
                    <input
                      id="agency_code"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none
                        focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
                      placeholder={t('placeholder.code')}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      aria-label={t('label.code')}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="agency_address"
                      className="text-sm font-medium text-black/80"
                    >
                      {t('label.address')}
                    </label>
                    <input
                      id="agency_address"
                      ref={addressInputRef}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none
                        focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
                      placeholder={t('placeholder.address')}
                      value={addressInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAddressInput(value);
                        setSelectedAddress((current) => {
                          if (!current) return null;
                          if (current.formattedAddress === value)
                            return current;
                          return null;
                        });
                      }}
                    />
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!canSubmitClient}
                      className="inline-flex items-center justify-center rounded-full bg-white/95 px-5 py-2.5 text-sm md:text-base font-semibold
                        text-primary shadow-sm border border-primary/20
                        hover:bg-primary hover:text-white transition whitespace-nowrap
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/95 disabled:hover:text-primary"
                    >
                      {loading ? t('button.loading') : t('button.submit')}
                    </button>
                  </div>
                </div>
              </form>
            ) : null}

            {/* TRAINER: Step 1 address -> Step 2 availability */}
            {mode === 'trainer' ? (
              <>
                {trainerStep === 'address' ? (
                  <div
                    className={[
                      'mt-6 rounded-3xl bg-white/95 shadow-[0_18px_60px_rgba(0,0,0,0.10)] border border-black/10 p-5 md:p-6',
                      className,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="trainer_address"
                          className="text-sm font-medium text-black/80"
                        >
                          {locale.startsWith('fr')
                            ? 'Votre adresse'
                            : 'Your address'}
                        </label>
                        <input
                          id="trainer_address"
                          ref={addressInputRef}
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none
                            focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
                          placeholder={
                            locale.startsWith('fr')
                              ? 'Commencez à taper…'
                              : 'Start typing…'
                          }
                          value={addressInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAddressInput(value);
                            setSelectedAddress((current) => {
                              if (!current) return null;
                              if (current.formattedAddress === value)
                                return current;
                              return null;
                            });
                          }}
                        />
                      </div>

                      {error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                          {error}
                        </div>
                      ) : null}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={!canContinueTrainerAddress}
                          onClick={() => {
                            if (!selectedAddress) {
                              setError(t('error.addressRequired'));
                              return;
                            }
                            setError(null);
                            setTrainerStep('availability');
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-white/95 px-5 py-2.5 text-sm md:text-base font-semibold
                            text-primary shadow-sm border border-primary/20
                            hover:bg-primary hover:text-white transition whitespace-nowrap
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/95 disabled:hover:text-primary"
                        >
                          {locale.startsWith('fr') ? 'Continuer' : 'Continue'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setTrainerStep('address')}
                        className="text-sm text-black/60 hover:text-black underline underline-offset-4"
                      >
                        {locale.startsWith('fr')
                          ? '← Modifier l’adresse'
                          : '← Edit address'}
                      </button>
                    </div>

                    <AssociateAgencyAvailability />
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
