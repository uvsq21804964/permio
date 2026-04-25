import type { RefObject } from 'react';

import { PHONE_COUNTRY_OPTIONS } from '@/lib/shared/phone-country-options';

type AssociateAgencyTrainerAddressFormProps = {
  addressInput: string;
  canContinue: boolean;
  className?: string;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  locale: string;
  onAddressChange: (value: string) => void;
  onAgencyNameChange: (value: string) => void;
  onContinue: () => void;
  onPhoneCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  trainerAgencyName: string;
  trainerPhoneCountryCode: string;
  trainerPhoneNumber: string;
  trainerWebsiteUrl: string;
};

export function AssociateAgencyTrainerAddressForm({
  addressInput,
  canContinue,
  className,
  error,
  inputRef,
  locale,
  onAddressChange,
  onAgencyNameChange,
  onContinue,
  onPhoneCountryCodeChange,
  onPhoneNumberChange,
  onWebsiteChange,
  trainerAgencyName,
  trainerPhoneCountryCode,
  trainerPhoneNumber,
  trainerWebsiteUrl,
}: AssociateAgencyTrainerAddressFormProps) {
  return (
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
          <label htmlFor="trainer_agency" className="text-sm font-medium text-black/80">
            {locale.startsWith('fr') ? "Nom de l'entreprise" : 'Company name'}
          </label>
          <input
            id="trainer_agency"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
            placeholder={locale.startsWith('fr') ? 'Ex: Smile & Wag' : 'e.g. Smile & Wag'}
            value={trainerAgencyName}
            onChange={(event) => onAgencyNameChange(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="trainer_website" className="text-sm font-medium text-black/80">
            {locale.startsWith('fr') ? 'URL du site' : 'Website URL'}
          </label>
          <input
            id="trainer_website"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
            placeholder="https://..."
            value={trainerWebsiteUrl}
            onChange={(event) => onWebsiteChange(event.target.value)}
            inputMode="url"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-black/80">
            {locale.startsWith('fr') ? 'Telephone professionnel' : 'Business phone'}
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
            <select
              value={trainerPhoneCountryCode}
              onChange={(event) => onPhoneCountryCodeChange(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
              aria-label={
                locale.startsWith('fr') ? 'Indicatif du pays' : 'Country calling code'
              }
            >
              {PHONE_COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              id="trainer_phone"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
              placeholder={
                locale.startsWith('fr') ? 'Ex: 6 12 34 56 78' : 'e.g. 555 123 4567'
              }
              value={trainerPhoneNumber}
              onChange={(event) => onPhoneNumberChange(event.target.value)}
              inputMode="tel"
              autoComplete="tel-national"
            />
          </div>
        </div>

        <div>
          <label htmlFor="trainer_address" className="text-sm font-medium text-black/80">
            {locale.startsWith('fr') ? 'Votre adresse' : 'Your address'}
          </label>
          <input
            id="trainer_address"
            ref={inputRef}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
            placeholder={locale.startsWith('fr') ? 'Commencez à taper…' : 'Start typing…'}
            value={addressInput}
            onChange={(event) => onAddressChange(event.target.value)}
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
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex items-center justify-center rounded-full bg-white/95 px-5 py-2.5 text-sm md:text-base font-semibold text-primary shadow-sm border border-primary/20 hover:bg-primary hover:text-white transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/95 disabled:hover:text-primary"
          >
            {locale.startsWith('fr') ? 'Continuer' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
