import { EMAIL_FROM, resend } from '@/src/lib/email/resend';
import { sql } from '@/lib/db';
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

function normalizePhoneHref(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
) {
  const digits = `${countryCode || ''}${phoneNumber || ''}`.replace(/[^\d+]/g, '');
  if (!digits.startsWith('+') || digits.length < 7) {
    return null;
  }

  return digits;
}

function formatPhoneDisplay(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
) {
  const parts = [countryCode?.trim(), phoneNumber?.trim()].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export async function loadTrainerContactDetails(clerk: any, userId: string) {
  const [clerkContact, rows] = await Promise.all([
    loadClerkUserContact(clerk, userId).catch(() => ({ email: null, name: null })),
    sql`
      SELECT
        "name",
        phone_country_code,
        phone_number
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `.catch(() => []),
  ]);

  const userRow = Array.isArray(rows) ? rows[0] : null;
  const phoneDisplay = formatPhoneDisplay(
    userRow?.phone_country_code,
    userRow?.phone_number,
  );

  return {
    email: clerkContact.email ?? null,
    name: clerkContact.name ?? userRow?.name ?? null,
    phoneDisplay,
    phoneHref: normalizePhoneHref(
      userRow?.phone_country_code,
      userRow?.phone_number,
    ),
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
