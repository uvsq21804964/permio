import Link from 'next/link';
import Stripe from 'stripe';

import {
  badgeMuted,
  btnPrimary,
  cardBase,
  cardPadding,
  type BillingTranslator,
} from '@/components/billing/billing-shared';

type BillingInvoicesSectionProps = {
  formatCurrency: (amount: number, currency: string) => string;
  invoices: Stripe.ApiList<Stripe.Invoice>;
  localeTag: string;
  t: BillingTranslator;
};

export function BillingInvoicesSection({
  formatCurrency,
  invoices,
  localeTag,
  t,
}: BillingInvoicesSectionProps) {
  return (
    <section className={`${cardBase} ${cardPadding}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">{t('invoices.title')}</h2>
        <div className="text-xs text-black/60">{t('invoices.subtitle')}</div>
      </div>

      {invoices.data.length === 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-black/70">{t('invoices.empty')}</div>
        </div>
      ) : (
        <div className="-mx-2 overflow-x-auto md:mx-0">
          <table className="min-w-full table-fixed border-collapse text-sm">
            <thead className="text-black/60">
              <tr className="border-y border-black/10">
                <th className="px-2 py-2 text-left font-medium">
                  {t('invoices.columns.date')}
                </th>
                <th className="px-2 py-2 text-left font-medium">
                  {t('invoices.columns.reference')}
                </th>
                <th className="px-2 py-2 text-left font-medium">
                  {t('invoices.columns.status')}
                </th>
                <th className="px-2 py-2 text-right font-medium">
                  {t('invoices.columns.amount')}
                </th>
                <th className="px-2 py-2 text-right font-medium">
                  {t('invoices.columns.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {invoices.data.map((invoice) => (
                <tr key={invoice.id} className="align-middle">
                  <td className="whitespace-nowrap px-2 py-2">
                    {new Date((invoice.created || 0) * 1000).toLocaleDateString(
                      localeTag
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span className="break-all font-medium text-black">
                      {invoice.number || invoice.id}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`${badgeMuted} capitalize`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <span className="font-medium text-black">
                      {formatCurrency(
                        invoice.total || 0,
                        invoice.currency?.toUpperCase() || 'EUR'
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
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
      )}
    </section>
  );
}
