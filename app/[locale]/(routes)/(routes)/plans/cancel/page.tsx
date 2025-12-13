'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CancelPage() {
  const t = useTranslations('cancel');

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="mt-4">{t('message')}</p>
      <Link
        className="mt-6 inline-block rounded bg-slate-800 px-4 py-2 text-white"
        href="/plans"
      >
        {t('backToPlans')}
      </Link>
    </main>
  );
}
