export type BillingTranslator = (
  path: string,
  vars?: Record<string, string | number | null | undefined>
) => string;

export const cardBase =
  'rounded-[28px] border border-black/10 bg-white/88 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur';
export const cardPadding = 'p-6 md:p-8';
export const subtlePanel =
  'rounded-2xl border border-black/10 bg-white/72 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur';
export const statCard =
  'rounded-2xl border border-black/10 bg-[#fffef2] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]';

const btnBase =
  'inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2';

export const btnPrimary = `${btnBase} bg-white/95 text-black border-black/25 hover:bg-white`;
export const btnGhost = `${btnBase} bg-transparent text-black border-black/20 hover:bg-white/70`;
export const btnDanger = `${btnBase} bg-white/95 text-red-700 border-red-300 hover:bg-white`;
export const btnMagic =
  'inline-flex items-center justify-center rounded-xl border-0 bg-gradient-to-r from-primary to-[#d400ff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A1B9A]/70 focus-visible:ring-offset-2';

const badgeBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium';
export const badgeMuted = `${badgeBase} border-black/15 bg-white/80 text-black/70`;
const badgePositive = `${badgeBase} border-emerald-300 bg-emerald-50 text-emerald-800`;
const badgeWarning = `${badgeBase} border-amber-300 bg-amber-50 text-amber-800`;
const badgeNeutral = `${badgeBase} border-black/15 bg-white/80 text-black/70`;

type BillingStatusBadgeProps = {
  isCanceled: boolean;
  isCancelScheduled: boolean;
  isInDbTrialWindow: boolean;
  status: string;
  t: BillingTranslator;
};

export function BillingStatusBadge({
  isCanceled,
  isCancelScheduled,
  isInDbTrialWindow,
  status,
  t,
}: BillingStatusBadgeProps) {
  if (isCanceled) {
    return <span className={badgeMuted}>{t('status.closed')}</span>;
  }

  if (isInDbTrialWindow) {
    return <span className={badgeWarning}>{t('status.trialing')}</span>;
  }

  if (isCancelScheduled) {
    return <span className={badgeWarning}>{t('status.closurePlanned')}</span>;
  }

  if (status === 'active') {
    return <span className={badgePositive}>{t('status.active')}</span>;
  }

  if (status === 'trialing') {
    return <span className={badgeWarning}>{t('status.trialing')}</span>;
  }

  if (status === 'past_due' || status === 'unpaid') {
    return <span className={badgeWarning}>{t('status.paymentPending')}</span>;
  }

  return <span className={badgeNeutral}>{status}</span>;
}
