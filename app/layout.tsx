// app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const SITE_NAME = 'MagicHango';
const DEFAULT_TITLE =
  'MagicHango | Smart booking and schedule optimization for dog trainers';
const DEFAULT_DESCRIPTION =
  'MagicHango helps dog trainers manage bookings, reduce travel time, group appointments, and deliver a smoother client experience.';

function getMetadataBase() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://magichango.com';

  try {
    return new URL(siteUrl);
  } catch {
    return new URL('https://magichango.com');
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'dog trainer booking software',
    'dog trainer scheduling',
    'dog training appointment software',
    'route optimization for dog trainers',
    'client management for dog trainers',
    'pet service scheduling',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'business',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: '/',
    images: [
      {
        url: '/Icone.png',
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/Icone.png'],
  },
  icons: {
    icon: { url: '/Icone.png', type: 'image/png' },
    apple: { url: '/Icone.png' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="flex h-screen w-screen items-center justify-center">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
