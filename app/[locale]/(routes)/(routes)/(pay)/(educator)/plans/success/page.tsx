'use client';

import Link from 'next/link';
import Image from 'next/image';
import { use } from 'react';
import { useTranslations } from 'next-intl';

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const t = useTranslations('success');
  const resolvedSearchParams = use(searchParams);
  const sessionId = Array.isArray(resolvedSearchParams.session_id)
    ? resolvedSearchParams.session_id[0]
    : resolvedSearchParams.session_id;

  return (
    <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
      <div className="mx-auto w-full max-w-xl">
        {/* Carte translucide */}
        <div className="rounded-2xl border border-black/10 bg-white/70 px-6 py-8 backdrop-blur md:px-8 md:py-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <header
            className="text-center break-words"
            style={{ hyphens: 'auto' }}
          >
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/70"
              aria-hidden="true"
            >
              <Image
                src="/NouveauLogoRogne2.png"
                alt={t('logoAlt')}
                width={50}
                height={50}
                className="md:w-[50px] md:h-[50px]"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black break-words">
              {t('title')}
            </h1>

            {sessionId ? (
              <p
                className="mt-2 text-xs md:text-sm text-black/60 break-words"
                style={{ hyphens: 'auto' }}
              >
                {t('sessionLabel')}&nbsp;
                <span className="font-mono break-all">{sessionId}</span>
              </p>
            ) : null}
          </header>

          <p
            className="mt-6 text-center text-black/80 break-words"
            style={{ hyphens: 'auto' }}
          >
            {t('message')}
          </p>

          {/* CTA principal */}
          <div className="mt-8 flex justify-center">
            <Link href="/myavailabilities" className="sm:w-auto">
              <span
                className={[
                  'inline-flex w-full items-center justify-center rounded-xl px-6 py-4 text-base font-semibold',
                  'border border-black/20 text-black',
                  'bg-white/90 hover:bg-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                  'motion-safe:transition motion-safe:duration-200',
                ].join(' ')}
              >
                {t('primaryCta')}
              </span>
            </Link>
          </div>

          {/* Lien secondaire (optionnel) */}
          <div className="mt-4 text-center">
            <Link
              href="/invoices"
              className="text-sm text-black/70 underline-offset-4 hover:underline motion-safe:transition break-words"
            >
              {t('secondaryCta')}
            </Link>
          </div>
        </div>

        {/* Note d’aide */}
        <p
          className="mt-6 text-center text-xs text-black/60 break-words"
          style={{ hyphens: 'auto' }}
        >
          {t('help.text')}{' '}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:no-underline"
          >
            {t('help.contactLink')}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
