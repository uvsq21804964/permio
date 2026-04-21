import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { SUPPORTED_LOCALES, type Locale, withLocale } from '@/src/lib/i18n';

async function resolveLocale(locale?: string): Promise<Locale> {
  if ((SUPPORTED_LOCALES as readonly string[]).includes(locale ?? '')) {
    return locale as Locale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value?.toLowerCase();
  if ((SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale ?? '')) {
    return cookieLocale as Locale;
  }

  return 'en';
}

export async function requireRole(
  allowedRoles: string[],
  redirectTo = '/',
  locale?: string
) {
  const resolvedLocale = await resolveLocale(locale);
  const { userId } = await auth();
  if (!userId) redirect(withLocale('/sign-in', resolvedLocale));

  const res = await sql`
    select role
    from "User"
    where id = ${userId}
    limit 1
  `;
  const me = res[0];
  if (!me) redirect(withLocale('/sign-in', resolvedLocale));

  if (!allowedRoles.includes(me.role)) {
    redirect(withLocale(redirectTo, resolvedLocale));
  }
}
