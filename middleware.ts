// middleware.ts
import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Déclare les routes publiques (pas de redirection même si la session est "pending")
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding/choose-organization',
  '/api/agency/association', // ⬅️ ton endpoint doit rester public
  '/agenda',
  '/configuration',
  // ajoute ici d’autres pages publiques si besoin...
]);

export default clerkMiddleware(async (auth, req) => {
  // Public → on laisse passer
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Privé → on exige un userId (et on traite les "pending" comme non connectés)
  const { userId } = await auth({
    treatPendingAsSignedOut: true,
  });

  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
});

export const config = { matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/api/(.*)'] };
