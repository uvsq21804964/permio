'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';

type CallToActionProps = {
  // ✅ optionnel : tu peux forcer un texte (sinon on prend i18n)
  titleKey?: string; // ex: 'cta.title'
  subtitleKey?: string; // ex: 'cta.subtitle'
  primaryHref?: string; // ex: '/sign-up' (sans locale)
  contactEmail?: string;
};

const buildMailto = (email: string, subject: string, body: string) => {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  return `mailto:${email}?subject=${s}&body=${b}`;
};

const CallToAction: React.FC<CallToActionProps> = ({
  titleKey = 'cta.title',
  subtitleKey = 'cta.subtitle',
  primaryHref = '/sign-up',
  contactEmail = 'tomabbouz@outlook.com',
}) => {
  const t = useTranslations('cta');
  const locale = useLocale();

  const subject = t('cta.email.subject');
  const body = t('cta.email.body');

  const mailtoHref = useMemo(
    () => buildMailto(contactEmail, subject, body),
    [contactEmail, subject, body]
  );

  const primaryHrefWithLocale = `/${locale}${
    primaryHref.startsWith('/') ? '' : '/'
  }${primaryHref.replace(/^\//, '')}`;

  return (
    <section id="cta" aria-labelledby="cta-heading" className="relative">
      <div className="bg-gradient-to-b from-primary/90 to-[#d400ff] py-14 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="cta-heading"
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-white"
            >
              {t(titleKey)}
            </h2>

            <p
              className="mt-3 md:mt-4 text-white/85 text-base md:text-lg leading-relaxed"
              aria-describedby="cta-proof"
            >
              {t(subtitleKey)}
            </p>

            <div className="mt-8 md:mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link href={primaryHrefWithLocale} className="sm:w-auto">
                <Button
                  aria-label={t('cta.primaryLabel')}
                  className={[
                    'w-full sm:w-auto rounded-xl px-6 py-5 text-base font-semibold',
                    'bg-yellow-400 text-[#6A1B9A]',
                    'hover:bg-primary hover:text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    'shadow-[0_6px_20px_rgba(0,0,0,0.15)]',
                    'motion-safe:transition motion-safe:duration-200',
                  ].join(' ')}
                >
                  {t('cta.primaryLabel')}
                </Button>
              </Link>

              <Link href={mailtoHref} className="sm:w-auto">
                <Button
                  aria-label={t('cta.secondaryLabel')}
                  variant="outline"
                  className={[
                    'w-full sm:w-auto rounded-xl px-6 py-5 text-base font-semibold',
                    'border-white/70 text-white',
                    'bg-white/10 hover:border-transparent',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    'motion-safe:transition motion-safe:duration-200',
                  ].join(' ')}
                >
                  {t('cta.secondaryLabel')}
                </Button>
              </Link>
            </div>

            <ul
              id="cta-proof"
              className="mt-6 flex flex-col items-center gap-2 text-white/80 text-sm md:flex-row md:justify-center md:gap-6"
            >
              <li>• {t('cta.proof.0')}</li>
              <li>• {t('cta.proof.1')}</li>
              <li>• {t('cta.proof.2')}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
