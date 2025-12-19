import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db'; // ⬅️ on interroge la DB côté serveur
import { Toaster } from '@/components/ui/sonner';
import DesktopNavbar from '@/components/navbar/navbar_desktop';
import MobileNavbar from '@/components/navbar/navbar_mobile';

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Récupère le rôle depuis ta table User
  let meRole: 'student' | 'instructor' | 'admin' | string | null = null;
  try {
    const rows = await sql`
      SELECT role FROM "User" WHERE id = ${userId} LIMIT 1
    `;
    meRole = rows[0]?.role ?? null;
    console.log('MeRole', meRole);
  } catch (e) {
    console.error('[layout] error fetching role:', e);
    meRole = null;
  }

  const logo = '/IconeAvecTitreLoin.png';
  const logo_mobile = '/IconeMobile.png';

  const pages = [
    { nameFR: 'Ma semaine', nameEN: 'Schedule', link: '/myweek', visible: 2 },
    { nameFR: 'Mes clients', nameEN: 'Clients', link: '/gestion', visible: 0 },
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
    { nameFR: 'Factures', nameEN: 'Invoices', link: '/invoices', visible: 0 }, // ou Facturation/invoices
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

  const activeLink = '/myweek';

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
          <p className="mb-4">Veuillez vous connecter</p>
          <SignIn fallbackRedirectUrl="/" forceRedirectUrl="/" />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="w-full h-screen flex flex-col">
          <div className="hidden md:flex flex-none inset-y-0 w-full h-12 z-50">
            <DesktopNavbar
              logo={logo}
              pages={pages as any}
              activeLink={activeLink}
              meRole={meRole}
            />
          </div>
          <div className="md:hidden h-[40px] fixed inset-y-0 w-full z-50">
            <MobileNavbar
              logo={logo_mobile}
              pages={pages as any}
              activeLink={activeLink}
              meRole={meRole}
            />
          </div>
          <div className="flex-1 h-[92%] bg-navbar">{children}</div>
        </div>
      </SignedIn>
    </>
  );
}
