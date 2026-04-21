// app/pricing/faq.tsx (ou ton chemin actuel)
'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function FAQ() {
  const t = useTranslations('faq');

  const items = [
    { id: 'whoFor' },
    { id: 'whyUse' },
    { id: 'publicBooking' },
    { id: 'payments' },
    { id: 'hiddenFees' },
    { id: 'cancelAnytime' },
    { id: 'trialPricing' },
    { id: 'prorata' },
    { id: 'privacyLocation' },
    { id: 'planningScope' },
    { id: 'optimization' },
    { id: 'mobileApp' },
    { id: 'calendarSync' },
    { id: 'cancellations' },
    { id: 'support' },
    { id: 'security' },
    { id: 'enterprise' },
  ] as const;

  return (
    <main className="px-6 md:px-10">
      <section
        id="faq"
        className="relative mx-auto w-full max-w-3xl px-4 py-14 md:py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-brand-radial"
        />

        <div className="relative">
          <div className="mx-auto max-w-[46rem] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground/90 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t('faq.badge')}</span>
            </div>

            <h2 className="mt-3 bg-gradient-to-r from-primary to-[#d400ff] bg-clip-text text-[clamp(1.6rem,1.2rem+1.3vw,2.1rem)] font-bold tracking-tight text-transparent">
              {t('faq.title')}
            </h2>

            <p className="mt-2 text-muted-foreground">{t('faq.subtitle')}</p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-8 w-full rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 shadow-sm"
          >
            {items.map(({ id }) => (
              <AccordionItem
                key={id}
                value={id}
                className="group/it border-b last:border-b-0"
              >
                <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&>svg]:ml-auto data-[state=open]:text-foreground">
                  <span className="font-medium">{t(`faq.items.${id}.q`)}</span>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {t(`faq.items.${id}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}

export default FAQ;
