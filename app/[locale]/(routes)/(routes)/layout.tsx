import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db'; // ⬅️ on interroge la DB côté serveur

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
  } catch (e) {
    console.error('[layout] error fetching role:', e);
    meRole = null;
  }

  const logo = '/logo_tab.png';

  const pages = [
    { name: 'Gestion', link: '/gestion', student: false },
    { name: 'Mes dispos', link: '/myavailabilities', student: true },
    { name: 'Ma semaine', link: '/myweek', student: true },
    { name: 'Configuration', link: '/configuration', student: true },
    { name: 'Se déconnecter', link: '/sign-out', student: true },
  ] as const;

  const activeLink = '/accueil';

  return (
    <>
      <SignedOut>
        <div className="p-6">
          <p className="mb-4">Veuillez vous connecter</p>
          <SignIn fallbackRedirectUrl="/" forceRedirectUrl="/" />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="w-full h-screen flex flex-col">
          <div className="hidden md:flex flex-none inset-y-0 w-full h-[8%] z-50">
            <DesktopNavbar
              logo={logo}
              pages={pages as any}
              activeLink={activeLink}
              meRole={meRole}
            />
          </div>
          <div className="md:hidden h-[40px] fixed inset-y-0 w-full z-50">
            <MobileNavbar
              logo={logo}
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
