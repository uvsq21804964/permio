import type { FormEvent, RefObject } from 'react';

import type { BillingTranslator } from '@/components/billing/billing-shared';

type AssociateAgencyClientFormProps = {
  addressInput: string;
  canSubmit: boolean;
  className?: string;
  code: string;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  onAddressChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  t: BillingTranslator;
};

export function AssociateAgencyClientForm({
  addressInput,
  canSubmit,
  className,
  code,
  error,
  inputRef,
  loading,
  onAddressChange,
  onCodeChange,
  onSubmit,
  t,
}: AssociateAgencyClientFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={[
        'mt-6 rounded-3xl bg-white/95 shadow-[0_18px_60px_rgba(0,0,0,0.10)] border border-black/10 p-5 md:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="agency_code" className="text-sm font-medium text-black/80">
            {t('label.code')}
          </label>
          <input
            id="agency_code"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
            placeholder={t('placeholder.code')}
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            aria-label={t('label.code')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label htmlFor="client_address" className="text-sm font-medium text-black/80">
            {t('label.address')}
          </label>
          <input
            id="client_address"
            ref={inputRef}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition"
            placeholder={t('placeholder.address')}
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
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-full bg-white/95 px-5 py-2.5 text-sm md:text-base font-semibold text-primary shadow-sm border border-primary/20 hover:bg-primary hover:text-white transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/95 disabled:hover:text-primary"
          >
            {loading ? t('button.loading') : t('button.submit')}
          </button>
        </div>
      </div>
    </form>
  );
}
