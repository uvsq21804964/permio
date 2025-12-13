'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';

type Step = {
  title: string;
  description: string;
  color: string;
};

const COLORS = [
  'bg-gradient-to-r from-primary to-[#d400ff]',
  'bg-gradient-to-r from-primary/95 to-[#d400ff]/95',
  'bg-gradient-to-r from-primary/85 to-[#d400ff]/85',
  'bg-gradient-to-r from-primary/80 to-[#d400ff]/80',
  'bg-gradient-to-r from-primary/75 to-[#d400ff]/75',
] as const;

const WorkflowCarousel = () => {
  const t = useTranslations('howItWorks');
  const locale = useLocale();
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const cardsToShow = 3;

  // Steps traduits
  const steps: Step[] = useMemo(
    () => [
      {
        title: t('workflow.steps.0.title'),
        description: t('workflow.steps.0.description'),
        color: COLORS[0],
      },
      {
        title: t('workflow.steps.1.title'),
        description: t('workflow.steps.1.description'),
        color: COLORS[1],
      },
      {
        title: t('workflow.steps.2.title'),
        description: t('workflow.steps.2.description'),
        color: COLORS[2],
      },
      {
        title: t('workflow.steps.3.title'),
        description: t('workflow.steps.3.description'),
        color: COLORS[3],
      },
      {
        title: t('workflow.steps.4.title'),
        description: t('workflow.steps.4.description'),
        color: COLORS[4],
      },
    ],
    [t]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    }
  }, []);

  const nextStep = () => {
    setCurrentStep(
      (prev) => (prev + 1) % Math.max(steps.length - cardsToShow + 1, 1)
    );
  };

  const prevStep = () => {
    const total = Math.max(steps.length - cardsToShow + 1, 1);
    setCurrentStep((prev) => (prev - 1 + total) % total);
  };

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft } = carouselRef.current;
        const cardWidth =
          (carouselRef.current.firstChild as HTMLElement)?.offsetWidth || 1;
        const newStep = Math.round(scrollLeft / cardWidth);
        setCurrentStep(newStep);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (carousel) {
        carousel.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden py-8 bg-gradient-to-t from-[#f9ffc6]/80 to-[#f9ffc6]/40">
      <div
        role="separator"
        className="mx-auto md:mb-24 h-px w-full max-w-6xl bg-primary max-md:hidden"
      />

      <div className="container mx-auto px-4">
        {/* Titre et Navigation */}
        <div className="flex flex-wrap justify-between items-center mb-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('workflow.heading')}
            </h2>
            <p className="text-gray-600 mt-2">{t('workflow.subheading')}</p>
          </div>

          {/* Flèches de navigation (Cachées sur mobile) */}
          <div className="hidden md:flex space-x-4">
            <Button
              onClick={prevStep}
              aria-label={t('workflow.nav.prev')}
              className="p-2 rounded-full bg-primary hover:bg-[#d400ff] transition-colors"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="#d400ff">
                <rect width="30" height="30" rx="15" fill="white" />
                <path
                  d="M16.7167 8.21674L10.2168 14.7167L16.5001 20.9999"
                  stroke="#d400ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            <Button
              onClick={nextStep}
              aria-label={t('workflow.nav.next')}
              className="p-2 rounded-full bg-primary hover:bg-[#d400ff] transition-colors"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="#d400ff">
                <rect
                  x="30"
                  y="30"
                  width="30"
                  height="30"
                  rx="15"
                  transform="rotate(-180 30 30)"
                  fill="white"
                />
                <path
                  d="M13.2833 21.7833L19.7832 15.2833L13.4999 9.00007"
                  stroke="#d400ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Carrousel */}
        <div className="relative">
          <div
            className="flex md:transition-transform duration-500 ease-in-out max-sm:overflow-x-auto snap-x scroll-smooth scrollbar-hide"
            style={
              windowWidth > 768
                ? {
                    transform:
                      steps.length > cardsToShow
                        ? `translateX(-${currentStep * (100 / cardsToShow)}%)`
                        : 'none',
                  }
                : {}
            }
            ref={carouselRef}
          >
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-1/3 px-4 snap-center"
              >
                <div
                  className={`p-6 md:p-8 rounded-lg shadow-lg ${step.color} text-white h-64 flex flex-col relative`}
                >
                  <h3 className="text-xl md:text-2xl font-bold mb-4">
                    {step.title}
                  </h3>
                  <p className="text-base md:text-lg">{step.description}</p>

                  <span className="absolute max-sm:bottom-0 md:top-0 right-8 text-[60px] md:text-[80px] font-bold opacity-40">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs (mobile) */}
        <div className="justify-center mt-6 space-x-2 max-sm:flex hidden">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentStep ? 'bg-primary scale-125' : 'bg-[#d400ff]'
              }`}
            />
          ))}
        </div>

        {/* Section inspirée */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 space-y-4 md:space-y-0 md:space-x-20 bg-white px-6 md:px-8 py-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-gray-900 text-base md:text-lg text-left">
            {t('workflow.bottom.pitchLine1')}
            <br className="visible md:hidden" />{' '}
            {t('workflow.bottom.pitchLine2')}
            <br className="visible md:hidden" />
            <br className="visible md:hidden" />
            {t('workflow.bottom.pitchLine3')}
          </p>

          <Button
            className="border border-[#d400ff]/40 text-[#d400ff] px-6 py-2 rounded-lg bg-white hover:bg-[#d400ff] hover:text-white transition-colors"
            onClick={() => router.push(`/${locale}/sign-up`)}
          >
            <p>{t('workflow.bottom.cta')}</p>
          </Button>
        </div>
      </div>

      <div
        role="separator"
        className="mx-auto md:mt-24 h-px w-full max-w-6xl bg-primary max-sm:w-[75%] max-sm:mt-22"
      />
    </section>
  );
};

export default WorkflowCarousel;
