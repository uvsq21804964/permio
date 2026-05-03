'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AddressMapPreview from '@/components/shared/AddressMapPreview';
import GooglePlacesScript from '@/components/shared/GooglePlacesScript';
import { getMyProfile } from '@/lib/client/api/me-client';
import { getAgencyUsers } from '@/lib/client/api/users-client';
import {
  getInstructorServiceCatalog,
  type ServicePricing,
} from '@/lib/client/api/services-client';
import { useGooglePlacesAutocomplete } from '@/lib/client/hooks/useGooglePlacesAutocomplete';
import {
  mapProfileAddressToDetails,
  matchesFormattedAddress,
  type AddressDetails,
} from '@/lib/client/utils/address';
import { isGoogleMapsPlacesReady } from '@/lib/client/utils/google-maps';

type AddressMode = 'saved' | 'custom';

function encodeAddress(address: AddressDetails): string {
  return encodeURIComponent(JSON.stringify(address));
}

export default function BookAddressPage() {
  const t = useTranslations('bookAddress');

  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get('serviceId');
  const clientUserId = searchParams.get('clientUserId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressMode, setAddressMode] = useState<AddressMode>('saved');
  const [savedAddress, setSavedAddress] = useState<AddressDetails | null>(null);
  const [savedAddressLoading, setSavedAddressLoading] = useState(true);

  const [isMapsReady, setIsMapsReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null,
  );

  useEffect(() => {
    if (isGoogleMapsPlacesReady() && !isMapsReady) {
      setIsMapsReady(true);
    }
  }, [isMapsReady]);

  useEffect(() => {
    if (!serviceId) {
      setError(t('errorNoService'));
    }
  }, [serviceId, t]);

  useEffect(() => {
    if (!serviceId) return;

    const run = async () => {
      try {
        const data = await getInstructorServiceCatalog({
          fallbackMessage: t('errorNoService'),
        });
        const numericId = Number(serviceId);
        const service: ServicePricing | undefined = (data.services || []).find(
          (item) => Number(item.id) === numericId,
        );

        if (service?.is_remote) {
          const params = new URLSearchParams({ serviceId: String(serviceId) });
          if (clientUserId) {
            params.set('clientUserId', clientUserId);
          }
          router.replace(`/book/proposals?${params.toString()}`);
        }
      } catch (fetchError) {
        console.error('Remote service check failed', fetchError);
      }
    };

    void run();
  }, [clientUserId, router, serviceId, t]);

  useEffect(() => {
    const fetchProfile = async () => {
      setSavedAddressLoading(true);
      try {
        if (clientUserId) {
          const users = await getAgencyUsers({
            role: 'student',
            fallbackMessage: t('errorNoSavedAddress'),
          });
          const client = users.find((user) => user.id === clientUserId);
          setSavedAddress(client ? mapProfileAddressToDetails(client) : null);
          return;
        }

        const data = await getMyProfile();
        setSavedAddress(mapProfileAddressToDetails(data.user));
      } catch (fetchError) {
        console.error('Erreur chargement profil pour adresse', fetchError);
      } finally {
        setSavedAddressLoading(false);
      }
    };

    void fetchProfile();
  }, [clientUserId, t]);

  useGooglePlacesAutocomplete({
    enabled: isMapsReady && addressMode === 'custom',
    inputRef: addressInputRef,
    fallbackFormattedAddress: addressInput,
    onSelect: (address) => {
      setAddressInput(address.formattedAddress);
      setSelectedAddress(address);
      setError(null);
    },
    onInvalidSelection: () => {
      setError(t('errorGeocoding'));
      setSelectedAddress(null);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!serviceId) return;

    setError(null);

    const address =
      addressMode === 'saved'
        ? savedAddress
        : selectedAddress;

    if (addressMode === 'saved' && !address) {
      setError(t('errorNoSavedAddress'));
      return;
    }

    if (addressMode === 'custom' && !address) {
      setError(t('errorNoCustomAddress'));
      return;
    }

    const params = new URLSearchParams({
      serviceId,
      addr: encodeAddress(address!),
    });
    if (clientUserId) {
      params.set('clientUserId', clientUserId);
    }

    router.push(`/book/proposals?${params.toString()}`);
  };

  const canSubmit =
    !!serviceId &&
    !loading &&
    ((addressMode === 'saved' && !!savedAddress) ||
      (addressMode === 'custom' && !!selectedAddress));

  return (
    <div className="min-h-screen bg-background p-6">
      <GooglePlacesScript
        onReady={() => setIsMapsReady(true)}
        onLoadError={(loadError) => {
          console.error('Erreur chargement Google Maps', loadError);
          setError(t('errorMapsScript'));
        }}
      />

      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">{t('title')}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{t('subtitle')}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-xs md:text-sm">
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      value="saved"
                      checked={addressMode === 'saved'}
                      onChange={() => setAddressMode('saved')}
                      disabled={savedAddressLoading || !savedAddress}
                    />
                    <span>
                      {t('modeSavedLabel')}
                      {savedAddressLoading ? (
                        <span className="ml-1 text-[11px] text-muted-foreground">
                          {t('modeSavedLoading')}
                        </span>
                      ) : null}
                      {!savedAddressLoading && !savedAddress ? (
                        <span className="ml-1 text-[11px] text-red-500">
                          {t('modeSavedNone')}
                        </span>
                      ) : null}
                    </span>
                  </label>

                  {savedAddress && addressMode === 'saved' ? (
                    <div className="ml-5 space-y-1 rounded border bg-muted/50 p-2 text-[11px]">
                      <div className="font-semibold">{t('savedAddressTitle')}</div>
                      <div>{savedAddress.formattedAddress}</div>
                      <div>
                        {savedAddress.postalCode} {savedAddress.city} (
                        {savedAddress.country})
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      value="custom"
                      checked={addressMode === 'custom'}
                      onChange={() => setAddressMode('custom')}
                    />
                    <span>{t('modeCustomLabel')}</span>
                  </label>

                  {addressMode === 'custom' ? (
                    <div className="ml-5 space-y-1">
                      <input
                        ref={addressInputRef}
                        className="w-full rounded border px-3 py-2 text-xs md:text-sm"
                        placeholder={t('addressPlaceholder')}
                        value={addressInput}
                        onChange={(event) => {
                          const value = event.target.value;
                          setAddressInput(value);
                          setSelectedAddress((current) => {
                            if (!current) return null;
                            return matchesFormattedAddress(current, value)
                              ? current
                              : null;
                          });
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {t('addressHelp')}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {addressMode === 'custom' ? (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {t('mapLabel')}
                  </span>
                  <AddressMapPreview
                    address={selectedAddress}
                    isMapsReady={isMapsReady}
                    loadingText={t('mapLoading')}
                    emptyText={t('mapNoCoords')}
                  />
                </div>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs md:text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={!canSubmit}>
                  {t('submitLabel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
