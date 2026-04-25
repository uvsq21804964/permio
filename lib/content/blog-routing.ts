import type { Locale } from '@/src/lib/i18n';

const BLOG_SLUGS = [
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
