'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';

type Props = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string; // chemin "nu" sans locale (ex: "/myavailabilities")
};

export default function LocaleLink({ href, ...rest }: Props) {
  const locale = useLocale() as Locale;
  return <Link href={withLocale(href, locale)} {...rest} />;
}
