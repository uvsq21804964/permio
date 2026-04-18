import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { inngest } from '@/src/lib/inngest/client';
import { resend, EMAIL_FROM } from '@/src/lib/email/resend';
import { render } from '@react-email/render';
import WelcomeClientEmail from '@/src/emails/welcomeClient';

type InstructorRow = {
  id: string;
  name: string | null;
};

type ClientRow = {
  id: string;
  name: string | null;
};

function getPrimaryEmail(user: {
  emailAddresses?: { id: string; emailAddress: string }[];
  primaryEmailAddressId?: string | null;
}) {
  if (!user?.emailAddresses?.length) return null;
  const primary =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  return primary ?? null;
}

export const welcomeClientEmail = inngest.createFunction(
  {
    id: 'agency-client-welcome-email',
    idempotency: 'event.id',
    retries: 5,
  },
  { event: 'agency/client-welcome' },
  async ({ event, step }) => {
    const { agencyId, agencyName, userId, locale } = event.data as {
      agencyId: string;
      agencyName: string;
      userId: string;
      locale?: string;
    };

    console.info('[welcomeClientEmail] event', {
      id: event.id,
      agencyId,
      agencyName,
      userId,
      locale,
    });

    const client = await step.run('load-client', async () => {
      const rows = await sql`
        SELECT id, name
        FROM "User"
        WHERE id = ${userId}
        LIMIT 1
      `;
      return (rows?.[0] ?? null) as ClientRow | null;
    });

    if (!client) {
      console.warn('[welcomeClientEmail] no client found', { userId });
      return { skipped: true, reason: 'no_client' };
    }

    const instructors = await step.run('load-instructors', async () => {
      const rows = await sql`
        SELECT id, name
        FROM "User"
        WHERE "agencyId" = ${agencyId}
          AND role = 'instructor'
        ORDER BY id ASC
      `;
      return (rows ?? []) as InstructorRow[];
    });

    const primaryInstructor = instructors[0] ?? null;

    const clerk = await clerkClient();

    const clientClerk = await step.run('load-client-email', async () => {
      try {
        const cu = await clerk.users.getUser(userId);
        return {
          email: getPrimaryEmail(cu),
          name:
            [cu.firstName, cu.lastName].filter(Boolean).join(' ').trim() ||
            cu.username ||
            null,
        };
      } catch (error) {
        console.error('[welcomeClientEmail] load-client-email error', error);
        return { email: null, name: null };
      }
    });

    const recipientEmail = clientClerk?.email ?? null;

    if (!recipientEmail) {
      console.warn('[welcomeClientEmail] no client email', {
        userId,
        agencyId,
      });
      return { skipped: true, reason: 'no_client_email' };
    }

    const displayClientName =
      client?.name ||
      clientClerk?.name ||
      ((locale || 'fr').startsWith('fr') ? 'Client' : 'Client');

    const subject = (locale || 'fr').startsWith('fr')
      ? `Bienvenue chez ${agencyName}`
      : `Welcome to ${agencyName}`;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');

    const lang = (locale || 'fr').startsWith('fr') ? 'fr' : 'en';

    const actionUrl = baseUrl
      ? `${baseUrl}/${lang}/book`
      : 'http://localhost:3000';

    const manageUrl = baseUrl
      ? `${baseUrl}/${lang}/reservations`
      : 'http://localhost:3000';

    const html = await step.run('render-email', async () => {
      return render(
        WelcomeClientEmail({
          firstName: displayClientName,
          agencyName,
          locale: lang,
          actionUrl,
          manageUrl,
          instructorName: primaryInstructor?.name || undefined,
          appUrl: baseUrl || 'http://localhost:3000',
        }),
      );
    });

    const result = await step.run('send-email', async () => {
      console.info('[welcomeClientEmail] sending email', {
        to: recipientEmail,
        subject,
        agencyId,
        agencyName,
      });

      return resend.emails.send({
        from: EMAIL_FROM,
        to: recipientEmail,
        subject,
        html,
        ...(event.id ? { headers: { 'X-Event-Id': event.id } } : {}),
      });
    });

    console.info('[welcomeClientEmail] send-email result', result);

    if ((result as any)?.error) {
      console.error('[welcomeClientEmail] send-email error', result);
      throw new Error('Resend error');
    }

    return {
      ok: true,
      recipient: recipientEmail,
      provider: result,
    };
  },
);
