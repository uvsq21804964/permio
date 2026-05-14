import type { Locale } from '@/src/lib/i18n';

const BLOG_SLUGS = [
  {
    en: 'prepare-outdoor-dog-training-session',
    fr: 'preparer-seance-exterieur-education-canine',
  },
  {
    en: 'weather-rescheduling-dog-training',
    fr: 'report-meteo-seances-education-canine',
  },
  {
    en: 'explain-dog-training-packages-booking-page',
    fr: 'expliquer-forfaits-page-reservation-education-canine',
  },
  {
    en: 'dog-trainer-school-holiday-planning',
    fr: 'planning-vacances-scolaires-educateur-canin',
  },
  {
    en: 'dog-training-maintenance-sessions',
    fr: 'seances-entretien-education-canine',
  },
  {
    en: 'best-first-session-time-slots-dog-training',
    fr: 'meilleurs-creneaux-premiere-seance-education-canine',
  },
  {
    en: 'qualify-urgent-dog-training-requests',
    fr: 'qualifier-demandes-urgentes-education-canine',
  },
  {
    en: 'manage-address-changes-dog-training',
    fr: 'gerer-changements-adresse-education-canine',
  },
  {
    en: 'use-client-feedback-dog-training-business',
    fr: 'utiliser-avis-clients-education-canine',
  },
  {
    en: 'prepare-home-dog-training-visit',
    fr: 'preparer-visite-domicile-education-canine',
  },
  {
    en: 'dog-trainer-waitlist-management',
    fr: 'gerer-liste-attente-educateur-canin',
  },
  {
    en: 'dog-training-booking-terms-that-clients-read',
    fr: 'conditions-reservation-education-canine-lisibles',
  },
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
