import type { FormEvent, RefObject } from 'react';

import type { BillingTranslator } from '@/components/billing/billing-shared';

type AssociateAgencyClientFormProps = {
  agencyName?: string | null;
  agencyPreview?: {
    agencyName?: string | null;
    trainerImageUrl?: string | null;
    trainerName?: string | null;
    trainerReviews?: Array<{
      clientName?: string | null;
      comment?: string | null;
      id: string;
      rating: number;
    }>;
    trainerStats?: {
      averageRating?: number | null;
      clientsCount: number;
      coursesCount: number;
      reviewsCount: number;
    } | null;
  } | null;
  agencyPreviewLoading?: boolean;
  addressInput: string;
  canSubmit: boolean;
  className?: string;
  code: string;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  isAgencyCodeLocked?: boolean;
  loading: boolean;
  onAddressChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  t: BillingTranslator;
};

export function AssociateAgencyClientForm({
  agencyName,
  agencyPreview,
  agencyPreviewLoading = false,
  addressInput,
  canSubmit,
  className,
  code,
  error,
  inputRef,
  isAgencyCodeLocked = false,
  loading,
  onAddressChange,
  onCodeChange,
  onSubmit,
  t,
}: AssociateAgencyClientFormProps) {
  const trainerName = agencyPreview?.trainerName?.trim() || null;
  const previewAgencyName =
    agencyPreview?.agencyName?.trim() || agencyName?.trim() || null;
  const trainerStats = agencyPreview?.trainerStats ?? null;
  const trainerReviews = agencyPreview?.trainerReviews ?? [];
  const hasPreviewCard =
    Boolean(previewAgencyName) ||
    Boolean(trainerName) ||
    Boolean(agencyPreview?.trainerImageUrl);
  const trainerInitials = trainerName
    ? trainerName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : null;
  const previewCardClassName =
    'min-h-[92px] rounded-2xl border border-black/10 px-4 py-3 shadow-sm';
  const statItems = [
    {
      key: 'clients',
      value: trainerStats?.clientsCount ?? 0,
      label: t('preview.stats.clients'),
    },
    {
      key: 'courses',
      value: trainerStats?.coursesCount ?? 0,
      label: t('preview.stats.courses'),
    },
    {
      key: 'rating',
      value:
        trainerStats?.averageRating != null
          ? `${trainerStats.averageRating.toFixed(1)} / 5`
          : t('preview.stats.noRating'),
      label: t('preview.stats.rating'),
    },
  ];

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
        {isAgencyCodeLocked ? (
          <div className={`${previewCardClassName} bg-[#fff9ef]`}>
            {agencyPreviewLoading ? (
              <div className="space-y-4">
                <div className="flex h-full min-h-[68px] items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-full border border-black/10 bg-[#f6ead3]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-28 rounded bg-black/10" />
                    <div className="mt-2 h-4 w-40 rounded bg-black/10" />
                    <div className="mt-2 h-3 w-48 max-w-full rounded bg-black/10" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2"
                    >
                      <div className="h-4 w-12 rounded bg-black/10" />
                      <div className="mt-2 h-3 w-20 rounded bg-black/10" />
                    </div>
                  ))}
                </div>
              </div>
            ) : hasPreviewCard ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {agencyPreview?.trainerImageUrl ? (
                    <img
                      src={agencyPreview.trainerImageUrl}
                      alt={trainerName || previewAgencyName || 'Agency preview'}
                      className="h-12 w-12 rounded-full border border-black/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#f6ead3] text-sm font-semibold text-black/70">
                      {trainerInitials ||
                        (previewAgencyName?.slice(0, 2).toUpperCase() ?? 'MH')}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">
                      {t('preview.label')}
                    </p>
                    {trainerName ? (
                      <p className="truncate text-sm font-semibold text-black/85">
                        {trainerName}
                      </p>
                    ) : null}
                    {previewAgencyName ? (
                      <p className="truncate text-sm text-black/65">
                        {previewAgencyName}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-sm text-black/65">
                      {previewAgencyName
                        ? t('preview.helpWithAgency', {
                            agencyName: previewAgencyName,
                          })
                        : t('preview.help')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {statItems.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2"
                    >
                      <p className="text-base font-semibold text-black/85">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-black/45">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                {trainerReviews.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">
                      {t('preview.reviewsTitle', {
                        count: trainerStats?.reviewsCount ?? trainerReviews.length,
                      })}
                    </p>

                    <div className="space-y-2">
                      {trainerReviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-medium text-black/85">
                              {review.clientName || t('preview.anonymousClient')}
                            </p>
                            <p className="shrink-0 text-xs font-semibold text-black/60">
                              {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
                            </p>
                          </div>
                          {review.comment ? (
                            <p className="mt-1 text-sm leading-5 text-black/65">
                              {review.comment}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full min-h-[68px] items-center text-sm text-black/65">
                {t('preview.help')}
              </div>
            )}
          </div>
        ) : (
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
        )}

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
