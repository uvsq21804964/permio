'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const CONTACT = {
  email: 'tomabbouz@outlook.com',
  phoneDisplay: '+33 6 59 57 33 45',
  phoneE164: '+33659573345',
};

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();

  const subject = encodeURIComponent(t('mail.subject'));
  const body = encodeURIComponent(t('mail.body'));
  const whatsappText = encodeURIComponent(t('whatsapp.text'));

  return (
    <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-5">
        {/* Colonne gauche : formulaire */}
        {/* <section className="md:col-span-3">
          <div className="rounded-2xl border border-black/10 bg-white/85 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
            <header className="mb-6 text-center md:text-left">
              <h1
                className="text-2xl md:text-3xl font-semibold text-black break-words"
                style={{ hyphens: 'auto' }}
              >
                {t('hero.title')}
              </h1>
              <p
                className="mt-2 text-sm text-black/70 break-words"
                style={{ hyphens: 'auto' }}
              >
                {t('hero.subtitle')}
              </p>
            </header>

            <form
              action="/api/contact"
              method="POST"
              className="space-y-4"
              autoComplete="on"
              noValidate
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-black"
                  >
                    {t('form.name.label')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder={t('form.name.placeholder')}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-black"
                  >
                    {t('form.email.label')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={t('form.email.placeholder')}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-black"
                  >
                    {t('form.phone.label')}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t('form.phone.placeholder')}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-black"
                  >
                    {t('form.subject.label')}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/60"
                    defaultValue="demo"
                  >
                    <option value="demo">
                      {t('form.subject.options.demo')}
                    </option>
                    <option value="support">
                      {t('form.subject.options.support')}
                    </option>
                    <option value="billing">
                      {t('form.subject.options.billing')}
                    </option>
                    <option value="partnership">
                      {t('form.subject.options.partnership')}
                    </option>
                    <option value="other">
                      {t('form.subject.options.other')}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-black"
                >
                  {t('form.message.label')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  placeholder={t('form.message.placeholder')}
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60 break-words"
                  style={{ hyphens: 'auto' }}
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-black/30 text-black focus:ring-black/60"
                />
                <label htmlFor="consent" className="text-sm text-black/70">
                  {t('form.consent.labelPrefix')}
                  <Link
                    href={`/${locale}/legal`}
                    className="underline underline-offset-4"
                  >
                    {t('form.consent.privacyLink')}
                  </Link>
                  {t('form.consent.labelSuffix')}
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={[
                    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-semibold',
                    'border border-black/25 text-black',
                    'bg-white/95 hover:bg-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2',
                    'motion-safe:transition motion-safe:duration-200',
                  ].join(' ')}
                >
                  {t('form.submit')}
                </button>
              </div>

              <p className="text-xs text-black/60">{t('form.responseTime')}</p>
            </form>
          </div>
        </section> */}

        {/* Colonne droite : moyens de contact + idées */}
        <aside className="md:col-span-2">
          <div className="rounded-2xl border border-black/10 bg-white/85 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
            <h2 className="text-lg font-semibold text-black">
              {t('sidebar.otherMeans.title')}
            </h2>

            <ul className="mt-4 space-y-3 text-sm">
              <li className="break-words" style={{ hyphens: 'auto' }}>
                📧 {t('sidebar.otherMeans.emailLabel')}:{' '}
                <Link
                  href={`mailto:${CONTACT.email}?subject=${subject}&body=${body}`}
                  className="underline"
                >
                  {CONTACT.email}
                </Link>
              </li>
              <li>
                📞 {t('sidebar.otherMeans.phoneLabel')}:{' '}
                <Link href={`tel:${CONTACT.phoneE164}`} className="underline">
                  {CONTACT.phoneDisplay}
                </Link>
              </li>
              <li className="break-words">
                💬 {t('sidebar.otherMeans.whatsappLabel')}:{' '}
                <Link
                  href={`https://wa.me/${CONTACT.phoneE164.replace(
                    '+',
                    ''
                  )}?text=${whatsappText}`}
                  target="_blank"
                  className="underline"
                >
                  {t('sidebar.otherMeans.whatsappCta')}
                </Link>
              </li>
            </ul>

            <div className="mt-6 border-t border-black/10 pt-6">
              <h3 className="text-sm font-semibold text-black">
                {t('sidebar.ideas.title')}
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black/80">
                <li>{t('sidebar.ideas.bullets.demo')}</li>
                <li>{t('sidebar.ideas.bullets.setup')}</li>
                <li>{t('sidebar.ideas.bullets.zones')}</li>
                <li>{t('sidebar.ideas.bullets.noShows')}</li>
                <li>{t('sidebar.ideas.bullets.calendar')}</li>
                <li>{t('sidebar.ideas.bullets.import')}</li>
                <li>{t('sidebar.ideas.bullets.holes')}</li>
                <li>{t('sidebar.ideas.bullets.billing')}</li>
                <li>{t('sidebar.ideas.bullets.partnership')}</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
