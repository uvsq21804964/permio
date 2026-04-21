import AddressMapPreview from '@/components/shared/AddressMapPreview';
import type { AddressDetails } from '@/lib/client/utils/address';
import type { ProfileTranslator } from '@/components/profile/profile-shared';

type AddressProfile = {
  address_label: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  formatted_address: string | null;
  google_place_id: string | null;
  lat: number | null;
  lng: number | null;
  postal_code: string | null;
  street: string | null;
  street_number: string | null;
};

type ProfileAddressCardProps = {
  address: AddressDetails | null;
  isMapsReady: boolean;
  onEditAddress: () => void;
  profile: AddressProfile;
  t: ProfileTranslator;
};

export function ProfileAddressCard({
  address,
  isMapsReady,
  onEditAddress,
  profile,
  t,
}: ProfileAddressCardProps) {
  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t('address.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('address.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEditAddress}
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
          >
            {t('address.edit')}
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-foreground">{t('address.label')}</span>
          <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
            {profile.address_label || '—'}
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-foreground">
            {t('address.formatted')}
          </span>
          <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground whitespace-pre-line">
            {profile.formatted_address || '—'}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">{t('address.street')}</span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.street || '—'}
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">{t('address.number')}</span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.street_number || '—'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">
              {t('address.postalCode')}
            </span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.postal_code || '—'}
            </p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-foreground">{t('address.city')}</span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.city || '—'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">
              {t('address.country')}
            </span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.country || '—'}
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">
              {t('address.countryCode')}
            </span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.country_code || '—'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-xs md:text-sm">
          <div className="space-y-1.5">
            <span className="font-medium text-foreground">
              {t('address.coords.label')}
            </span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
              {profile.lat != null && profile.lng != null
                ? `${profile.lat.toFixed(6)}, ${profile.lng.toFixed(6)}`
                : t('address.coords.empty')}
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="font-medium text-foreground">
              {t('address.placeId.label')}
            </span>
            <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground text-[11px] break-all">
              {profile.google_place_id || '—'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-foreground">{t('address.map.label')}</span>
          <AddressMapPreview
            address={address}
            isMapsReady={isMapsReady}
            loadingText={t('address.map.loading')}
            emptyText={t('address.map.noCoords')}
          />
        </div>
      </div>
    </section>
  );
}
