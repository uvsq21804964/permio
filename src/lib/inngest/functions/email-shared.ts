import { EMAIL_FROM, resend } from '@/src/lib/email/resend';
import { devLogger } from '@/lib/shared/dev-logger';

type ClerkEmailUser = {
  emailAddresses?: { id: string; emailAddress: string }[];
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddressId?: string | null;
  username?: string | null;
};

type SupportedEmailLocale = 'en' | 'fr';

function getPrimaryEmail(user: ClerkEmailUser | null | undefined) {
  if (!user?.emailAddresses?.length) return null;

  const primary =
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  return primary ?? null;
}

function getDisplayNameFromClerkUser(
  user: ClerkEmailUser | null | undefined,
) {
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || null;
}

export function toEmailLocale(locale?: string): SupportedEmailLocale {
  return (locale || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function getAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
}

export function buildLocalizedAppUrl(
  locale: SupportedEmailLocale,
  pathname: string,
) {
  const baseUrl = getAppBaseUrl();
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return baseUrl
    ? `${baseUrl}/${locale}${normalizedPath}`
    : 'http://localhost:3000';
}

export async function loadClerkUserContact(clerk: any, userId: string) {
  const user = await clerk.users.getUser(userId);

  return {
    email: getPrimaryEmail(user),
    name: getDisplayNameFromClerkUser(user),
  };
}

export async function sendTransactionalEmail(params: {
  eventId?: string;
  html: string;
  subject: string;
  to: string | string[];
}) {
  const { eventId, html, subject, to } = params;

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    ...(eventId ? { headers: { 'X-Event-Id': eventId } } : {}),
  });
}

export const inngestEmailLogger = {
  error: (...args: unknown[]) => console.error(...args),
  info: (...args: unknown[]) => devLogger.info(...args),
  warn: (...args: unknown[]) => devLogger.warn(...args),
} as const;
