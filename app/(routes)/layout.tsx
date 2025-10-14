import {
  SignedIn,
  SignedOut,
  SignIn,
  OrganizationSwitcher,
  useOrganization,
} from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }
  return (
    <>
      <SignedOut>
        <div className="p-6">
          <p className="mb-4">Veuillez vous connecter</p>
          <SignIn fallbackRedirectUrl="/" forceRedirectUrl="/" />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="p-4 flex items-center gap-3">
          {/* Ne montrer le switcher QUE s'il y a déjà une org active */}
          {typeof window !== 'undefined' && <ShowSwitcherWhenOrg />}
          {/* <OrgGate /> */}
        </div>
        <div className="min-h-screen bg-background p-6">{children}</div>
      </SignedIn>
    </>
  );
}

function ShowSwitcherWhenOrg() {
  const { organization } = useOrganization();
  if (!organization) return null;
  return <OrganizationSwitcher />;
}
