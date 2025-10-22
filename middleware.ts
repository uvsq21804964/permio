// middleware.ts
import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const SUPPORTED_LOCALES = ['fr', 'en', 'ro'] as const;
const DEFAULT_LOCALE = 'fr';

function extractLocale(pathname: string) {
  const match = pathname.match(/^\/([a-zA-Z-]{2})(\/|$)/);
  const l = match?.[1]?.toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(l as string)
    ? (l as any)
    : null;
}

// Déclare les routes publiques (avec OU sans locale)
const isPublicRoute = createRouteMatcher([
  // non localisées (fallback)
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding/choose-organization',
  '/api/agency/association',
  '/myavailabilities',
  '/configuration',

  // localisées
  '/(fr|en|ro)/sign-in(.*)',
  '/(fr|en|ro)/sign-up(.*)',
  '/(fr|en|ro)/onboarding/choose-organization',
  '/(fr|en|ro)/myavailabilities',
  '/(fr|en|ro)/configuration',
]);

export default clerkMiddleware(async (auth, req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  // 0) Ignorer les assets/_next
  if (/\.(?:\w+)$/.test(pathname) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }
  // 0bis) Laisser passer toutes les API (tu peux restreindre si besoin)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 1) Rediriger "/" vers "/fr"
  if (pathname === '/') {
    const url = nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    return NextResponse.redirect(url);
  }

  // 2) Forcer un préfixe de langue si absent
  const locale = extractLocale(pathname);
  if (!locale) {
    const url = nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // 3) Routes publiques → laisser passer
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 4) Routes privées → exiger une session
  const { userId } = await auth({ treatPendingAsSignedOut: true });
  if (!userId) {
    const url = nextUrl.clone();
    // Préserver la locale détectée et t’emmener vers la page de login localisée
    url.pathname = `/${locale}/sign-in`;
    // Tu peux aussi ajouter un param "redirect_url" si tu veux revenir après login
    url.searchParams.set('redirect_url', nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Passe le middleware sur toutes les routes "pages" et API
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/api/(.*)'],
};
