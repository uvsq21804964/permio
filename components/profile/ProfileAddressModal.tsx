import type { ChangeEvent, FormEvent, RefObject } from 'react';

import type { AddressDetails } from '@/lib/client/utils/address';
import type { ProfileTranslator } from '@/components/profile/profile-shared';

type AddressDraft = {
  address_label: string;
  formatted_address: string;
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  country: string;
  country_code: string;
};

type ProfileAddressModalProps = {
  addressError: string | null;
  draftAddress: AddressDraft;
  formattedAddressRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  open: boolean;
  saving: boolean;
  selectedAddress: AddressDetails | null;
  t: ProfileTranslator;
};

export function ProfileAddressModal({
  addressError,
  draftAddress,
  formattedAddressRef,
  onChange,
  onClose,
  onSubmit,
  open,
  saving,
  selectedAddress,
  t,
}: ProfileAddressModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('modals.address.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('common.close')}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{t('modals.address.helper')}</p>

        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <label htmlFor="address_label" className="text-xs font-medium text-foreground">
              {t('address.label')}
            </label>
            <input
              id="address_label"
              name="address_label"
              value={draftAddress.address_label}
              onChange={onChange}
              placeholder={t('modals.address.labelPlaceholder')}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="formatted_address"
              className="text-xs font-medium text-foreground"
            >
              {t('address.formatted')}
            </label>
            <input
              id="formatted_address"
              name="formatted_address"
              ref={formattedAddressRef}
              value={draftAddress.formatted_address}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder={t('modals.address.formattedPlaceholder')}
            />
          </div>

          {selectedAddress ? (
            <div className="mt-1 rounded bg-gray-50 border text-xs p-2 space-y-1">
              <div className="font-semibold">{t('modals.address.selectedTitle')}</div>
              <div>{selectedAddress.formattedAddress}</div>
              <div>
                <span className="font-medium">
                  {t('modals.address.selectedStreet')}{' '}
                </span>
                {selectedAddress.streetNumber} {selectedAddress.street}
              </div>
              <div>
                <span className="font-medium">{t('modals.address.selectedCity')} </span>
                {selectedAddress.postalCode} {selectedAddress.city} (
                {selectedAddress.country})
              </div>
            </div>
          ) : null}

          {addressError ? <p className="text-xs text-red-600">{addressError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
