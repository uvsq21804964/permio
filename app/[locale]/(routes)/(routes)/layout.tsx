import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { Toaster } from '@/components/ui/sonner';
import DesktopNavbar from '@/components/navbar/navbar_desktop';
import MobileNavbar from '@/components/navbar/navbar_mobile';
import type { NavPage } from '@/components/navbar/navbar-utils';

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale ?? 'en';

  const { userId } = await auth();
  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  let meRole: 'student' | 'instructor' | 'admin' | string | null = null;
  try {
    const rows = await sql`
      SELECT role FROM "User" WHERE id = ${userId} LIMIT 1
    `;
    meRole = rows[0]?.role ?? null;
  } catch (e) {
    console.error('[layout] error fetching role:', e);
    meRole = null;
  }

  const logo = '/NouveauLogoRogne2.png';
  const logoMobile = '/NouveauLogoRogne2.png';

  const pages: NavPage[] = [
    { nameFR: 'Ma semaine', nameEN: 'Schedule', link: '/myweek', visible: 2 },
    { nameFR: 'Blog', nameEN: 'Blog', link: '/blog', visible: 2 },
    { nameFR: 'Mes clients', nameEN: 'Clients', link: '/gestion', visible: 0 },
    {
      nameFR: 'Réserver client',
      nameEN: 'Book client',
      link: '/book-for-client',
      visible: 0,
    },
    {
      nameFR: 'Mes services',
      nameEN: 'Services',
      link: '/services',
      visible: 0,
    },
    {
      nameFR: 'Mes dispos',
      nameEN: 'My availability',
      link: '/availability',
      visible: 0,
    },
    { nameFR: 'Factures', nameEN: 'Invoices', link: '/invoices', visible: 0 },
    { nameFR: 'Réserver', nameEN: 'Book', link: '/book/services', visible: 1 },
    {
      nameFR: 'Abonnement',
      nameEN: 'Subscription',
      link: '/plans',
      visible: 0,
    },
    { nameFR: 'Paramètres', nameEN: 'Settings', link: '/profile', visible: 2 },
    {
      nameFR: 'Se déconnecter',
      nameEN: 'Log out',
      link: '/sign-out',
      visible: 2,
    },
  ] as const;

  return (
    <>
      <Toaster
        position="top-right"
        theme="system"
        richColors
        toastOptions={{
          classNames: {
            toast: 'border-brand/40',
            actionButton: 'bg-brand-gradient text-white',
          },
        }}
      />

      <SignedOut>
        <div className="p-6">
          <p className="mb-4">
            {locale.startsWith('fr')
              ? 'Veuillez vous connecter'
              : 'Please sign in'}
          </p>
          <SignIn
            fallbackRedirectUrl={`/${locale}/`}
            forceRedirectUrl={`/${locale}/`}
          />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex min-h-screen w-full flex-col">
          <div className="inset-y-0 hidden h-12 w-full flex-none md:flex z-50">
            <DesktopNavbar
              logo={logo}
              pages={pages}
              meRole={meRole}
            />
          </div>

          <div className="fixed inset-x-0 top-0 w-full md:hidden z-50">
            <MobileNavbar
              logo={logoMobile}
              pages={pages}
              meRole={meRole}
            />
          </div>

          <div className="flex-1 bg-navbar pt-16 md:pt-0">{children}</div>
        </div>
      </SignedIn>
    </>
  );
}
