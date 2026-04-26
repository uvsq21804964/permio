import Link from 'next/link';
import Stripe from 'stripe';

import {
  badgeMuted,
  btnPrimary,
  cardBase,
  cardPadding,
  subtlePanel,
  type BillingTranslator,
} from '@/components/billing/billing-shared';

type BillingInvoicesSectionProps = {
  formatCurrency: (amount: number, currency: string) => string;
  invoices: Stripe.ApiList<Stripe.Invoice>;
  localeTag: string;
  t: BillingTranslator;
};

function formatInvoiceDate(createdAt: number, localeTag: string) {
  return new Date((createdAt || 0) * 1000).toLocaleDateString(localeTag);
}

export function BillingInvoicesSection({
  formatCurrency,
  invoices,
  localeTag,
  t,
}: BillingInvoicesSectionProps) {
  return (
    <section className={`${cardBase} ${cardPadding}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.2em] text-black/45">
            {t('invoices.eyebrow')}
          </div>
          <h2 className="text-xl font-semibold text-black">{t('invoices.title')}</h2>
          <p className="text-sm text-black/65">{t('invoices.subtitle')}</p>
        </div>

        <div className="rounded-full border border-black/10 bg-white/75 px-3 py-1 text-xs text-black/60">
          {t('invoices.count', { count: invoices.data.length })}
        </div>
      </div>

      {invoices.data.length === 0 ? (
        <div className={`mt-6 ${subtlePanel} p-5`}>
          <div className="text-sm text-black/70">{t('invoices.empty')}</div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 md:hidden">
            {invoices.data.map((invoice) => (
              <article key={invoice.id} className={`${subtlePanel} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs uppercase tracking-[0.18em] text-black/45">
                      {formatInvoiceDate(invoice.created || 0, localeTag)}
                    </div>
                    <div className="break-all font-medium text-black">
                      {invoice.number || invoice.id}
                    </div>
                  </div>
                  <span className={`${badgeMuted} shrink-0 capitalize`}>
                    {invoice.status}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-black/50">
                      {t('invoices.columns.amount')}
                    </div>
                    <div className="text-base font-semibold text-black">
                      {formatCurrency(
                        invoice.total || 0,
                        invoice.currency?.toUpperCase() || 'EUR'
                      )}
                    </div>
                  </div>

                  {invoice.invoice_pdf ? (
                    <Link
                      href={invoice.invoice_pdf}
                      target="_blank"
                      className={btnPrimary}
                    >
                      {t('invoices.actions.downloadPdf')}
                    </Link>
                  ) : invoice.hosted_invoice_url ? (
                    <Link
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      className={btnPrimary}
                    >
                      {t('invoices.actions.viewOnline')}
                    </Link>
                  ) : (
                    <span className="text-black/50">-</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead className="text-black/55">
                <tr className="border-y border-black/10">
                  <th className="px-2 py-3 text-left font-medium">
                    {t('invoices.columns.date')}
                  </th>
                  <th className="px-2 py-3 text-left font-medium">
                    {t('invoices.columns.reference')}
                  </th>
                  <th className="px-2 py-3 text-left font-medium">
                    {t('invoices.columns.status')}
                  </th>
                  <th className="px-2 py-3 text-right font-medium">
                    {t('invoices.columns.amount')}
                  </th>
                  <th className="px-2 py-3 text-right font-medium">
                    {t('invoices.columns.action')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {invoices.data.map((invoice) => (
                  <tr key={invoice.id} className="align-middle">
                    <td className="whitespace-nowrap px-2 py-3">
                      {formatInvoiceDate(invoice.created || 0, localeTag)}
                    </td>
                    <td className="px-2 py-3">
                      <span className="break-all font-medium text-black">
                        {invoice.number || invoice.id}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className={`${badgeMuted} capitalize`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="font-medium text-black">
                        {formatCurrency(
                          invoice.total || 0,
                          invoice.currency?.toUpperCase() || 'EUR'
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      {invoice.invoice_pdf ? (
                        <Link
                          href={invoice.invoice_pdf}
                          target="_blank"
                          className={btnPrimary}
                        >
                          {t('invoices.actions.downloadPdf')}
                        </Link>
                      ) : invoice.hosted_invoice_url ? (
                        <Link
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          className={btnPrimary}
                        >
                          {t('invoices.actions.viewOnline')}
                        </Link>
                      ) : (
                        <span className="text-black/50">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
