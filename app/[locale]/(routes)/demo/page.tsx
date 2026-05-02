import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';

import { OptimizationDemo } from '@/components/magic-hango/OptimizationDemo';
import { OptimizationDemoMobile } from '@/components/magic-hango/OptimizationDemoMobile';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import type { Locale } from '@/src/lib/i18n';

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'magicHango' });
  const { userId } = await auth();
  const logo = '/NouveauLogoRogne2.png';
  const isFrench = locale === 'fr';
  const demoMailLabel = isFrench ? 'ou demander une démo' : 'or request a demo';
  const demoMailSubject = isFrench
    ? 'Demande de demo personnalisee MagicHango'
    : 'Custom MagicHango demo request';
  const demoMailBody = isFrench
    ? 'Bonjour Tom,\n\nJe souhaite demander une demo personnalisee de MagicHango en face a face.\n\nMon nom :\nMon entreprise :\nMa ville :\nMes disponibilites :\n\nMerci,'
    : "Hi Tom,\n\nI'd like to request a custom in-person demo of MagicHango.\n\nMy name:\nMy business:\nMy city:\nMy preferred dates:\n\nThanks,";
  const demoMailHref = `mailto:tom@magichango.com?subject=${encodeURIComponent(
    demoMailSubject,
  )}&body=${encodeURIComponent(demoMailBody)}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(255,251,224,0.98)_38%,rgba(247,244,213,1)_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.14),transparent_38%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-40 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-64 h-80 w-80 rounded-full bg-sky-100/30 blur-3xl" />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/6 bg-white/95 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
        <div className="mx-auto flex h-10 max-w-6xl items-stretch justify-between px-4 md:h-12 md:px-8">
          <Link
            href={`/${locale}/home`}
            className="flex min-w-0 items-end gap-2"
          >
            <span className="relative h-full w-14 shrink-0 md:w-16">
              <Image
                src={logo}
                alt="MagicHango"
                fill
                sizes="64px"
                className="object-contain object-bottom"
                priority
              />
            </span>
            <BrandWordmark tone="dark" className="hidden md:inline-flex" />
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-black/5 md:text-sm"
            >
              {t('nav.blog')}
            </Link>

            {userId ? (
              <Link
                href={`/${locale}/myweek`}
                className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95 md:text-sm"
              >
                {t('nav.openApp')}
              </Link>
            ) : (
              <>
                <Link
                  href={`/${locale}/sign-in`}
                  className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-black/5 md:text-sm"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href={`/${locale}/sign-up`}
                  className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-95 md:text-sm"
                >
                  {t('nav.tryFree')}
                </Link>
              </>
            )}

            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="relative px-4 pb-8 pt-[calc(4rem+env(safe-area-inset-top))] md:px-8 md:pb-12 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="md:hidden">
            <OptimizationDemoMobile locale={locale} />
          </div>
          <div className="hidden md:block">
            <OptimizationDemo locale={locale} />
          </div>

          <section className="relative mt-10 overflow-hidden rounded-[36px] border border-slate-900/10 bg-slate-950 px-6 py-8 text-white shadow-[0_38px_100px_-60px_rgba(15,23,42,0.9)] md:px-8 md:py-9">
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_55%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                  {t('cta.eyebrow')}
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl md:leading-tight">
                  {t('cta.title')}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 md:text-base">
                  {t('cta.subtitle')}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <div className="flex flex-col items-center gap-2">
                  <Link
                    href={`/${locale}/${userId ? 'myweek' : 'sign-up'}`}
                    className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_34px_-24px_rgba(255,255,255,0.7)] transition hover:bg-white/92"
                  >
                    {userId ? t('cta.openApp') : t('cta.startTrial')}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3.5 10h13" />
                      <path d="m11.5 6.5 5 3.5-5 3.5" />
                    </svg>
                  </Link>
                  {!userId ? (
                    <p className="w-full text-center text-xs font-medium text-white/62">
                      {t('cta.noCardRequired')}
                    </p>
                  ) : null}
                  <Link
                    href={demoMailHref}
                    className="mt-2 inline-flex items-center rounded-full border border-white/16 px-3 py-1.5 text-xs font-medium text-white/82 transition hover:bg-white/6 hover:text-white md:text-sm"
                  >
                    {demoMailLabel}
                  </Link>
                  <Link
                    href={`/${locale}/email-tracking`}
                    className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/12 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-400/18 hover:text-white md:text-sm"
                  >
                    {isFrench ? 'voir le suivi des emails' : 'view email tracking'}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
