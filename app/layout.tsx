import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Permio - Le permis à toute vitesse',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: {
    icon: { url: '/logo_tab.png', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={frFR}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
      taskUrls={{
        'choose-organization': '/onboarding/choose-organization',
      }}
    >
      <html lang="fr">
        <body
          className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
        >
          <div className="flex h-screen w-screen justify-center items-center">
            {children}
          </div>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
