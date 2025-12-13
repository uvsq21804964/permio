// app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Magic Hango - Create time together, magically',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: { icon: { url: '/iconeSansFond.png', type: 'image/png' } },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      {/* lang par défaut; voir note ci-dessous */}
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="flex h-screen w-screen justify-center items-center">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
