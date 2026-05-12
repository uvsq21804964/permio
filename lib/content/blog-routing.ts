import type { Locale } from '@/src/lib/i18n';

const BLOG_SLUGS = [
  {
    en: 'reactivate-past-dog-training-clients',
    fr: 'relancer-anciens-clients-education-canine',
  },
  {
    en: 'schedule-group-dog-training-sessions',
    fr: 'planifier-seances-groupe-education-canine',
  },
  {
    en: 'dog-training-appointment-reminder-quality',
    fr: 'ameliorer-rappels-rendez-vous-education-canine',
  },
  {
    en: 'dog-trainer-intake-form-before-first-session',
    fr: 'formulaire-client-avant-premiere-seance-education-canine',
  },
  {
    en: 'dog-training-package-scheduling',
    fr: 'planifier-forfaits-seances-education-canine',
  },
  {
    en: 'travel-buffers-between-dog-training-sessions',
    fr: 'marges-trajet-entre-seances-education-canine',
  },
  {
    en: 'dog-trainer-service-area-planning',
    fr: 'organiser-zones-intervention-educateur-canin',
  },
  {
    en: 'best-slots-to-offer-dog-training-clients',
    fr: 'meilleurs-creneaux-proposer-clients-education-canine',
  },
  {
    en: 'weekly-calendar-reset-dog-trainers',
    fr: 'routine-hebdomadaire-planning-educateur-canin',
  },
  {
    en: 'track-travel-time-dog-trainer-calendar',
    fr: 'suivre-temps-trajet-planning-educateur-canin',
  },
  {
    en: 'client-self-booking-vs-trainer-booking',
    fr: 'reservation-client-ou-educateur-canin',
  },
  {
    en: 'dog-trainer-weekly-planning',
    fr: 'planifier-semaine-educateur-canin',
  },
  {
    en: 'prepare-first-dog-training-session',
    fr: 'preparer-premiere-seance-education-canine',
  },
  {
    en: 'reduce-no-shows-dog-training',
    fr: 'reduire-absences-rendez-vous-education-canine',
  },
] as const;

export function resolveLocalizedBlogPathname(
  pathname: string,
  currentLocale: Locale,
  nextLocale: Locale,
) {
  const match = pathname.match(/^\/([a-zA-Z-]{2})\/blog\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const currentSlug = match[2];
  const slugSet = BLOG_SLUGS.find(
    (entry) => entry[currentLocale] === currentSlug,
  );

  if (!slugSet) {
    return `/${nextLocale}/blog`;
  }

  return `/${nextLocale}/blog/${slugSet[nextLocale]}`;
}
