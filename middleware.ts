// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const SUPPORTED_LOCALES = ['fr', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = 'en';
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

function extractLocale(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/([a-zA-Z-]{2})(\/|$)/);
  const locale = match?.[1]?.toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale as string)
    ? (locale as SupportedLocale)
    : null;
}

function getPreferredLocale(req: NextRequest): SupportedLocale {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value?.toLowerCase();
  if ((SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale ?? '')) {
    return cookieLocale as SupportedLocale;
  }

  const acceptLanguage = req.headers.get('accept-language') ?? '';
  for (const part of acceptLanguage.split(',')) {
    const language = part.split(';')[0]?.trim().toLowerCase().slice(0, 2);
    if ((SUPPORTED_LOCALES as readonly string[]).includes(language ?? '')) {
      return language as SupportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

function withLocaleCookie(response: NextResponse, locale: SupportedLocale) {
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-out(.*)',
  '/onboarding/choose-organization',
  '/home',
  '/leastory',
  '/(fr|en)/sign-in(.*)',
  '/(fr|en)/sign-up(.*)',
  '/(fr|en)/sign-out(.*)',
  '/(fr|en)/onboarding/choose-organization',
  '/(fr|en)/home',
  '/(fr|en)/leastory',
]);

export default clerkMiddleware(async (auth, req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  if (/\.(?:\w+)$/.test(pathname) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const preferredLocale = getPreferredLocale(req);
    const { userId } = await auth({ treatPendingAsSignedOut: true });
    const url = nextUrl.clone();
    url.pathname = userId
      ? `/${preferredLocale}/myweek`
      : `/${preferredLocale}/home`;
    return withLocaleCookie(NextResponse.redirect(url), preferredLocale);
  }

  const locale = extractLocale(pathname);
  if (!locale) {
    const preferredLocale = getPreferredLocale(req);
    const url = nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname}`;
    return withLocaleCookie(NextResponse.redirect(url), preferredLocale);
  }

  if (pathname === `/${locale}`) {
    const { userId } = await auth({ treatPendingAsSignedOut: true });
    const url = nextUrl.clone();
    url.pathname = userId ? `/${locale}/myweek` : `/${locale}/home`;
    return withLocaleCookie(NextResponse.redirect(url), locale);
  }

  if (isPublicRoute(req)) {
    return withLocaleCookie(NextResponse.next(), locale);
  }

  const { userId } = await auth({ treatPendingAsSignedOut: true });
  if (!userId) {
    const url = nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.searchParams.set('redirect_url', nextUrl.pathname + nextUrl.search);
    return withLocaleCookie(NextResponse.redirect(url), locale);
  }

  return withLocaleCookie(NextResponse.next(), locale);
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/api/(.*)'],
};
