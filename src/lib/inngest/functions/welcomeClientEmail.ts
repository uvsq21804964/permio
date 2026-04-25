import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import { sql } from '@/lib/db';
import WelcomeClientEmail from '@/src/emails/welcomeClient';
import { inngest } from '@/src/lib/inngest/client';
import {
  buildLocalizedAppUrl,
  getAppBaseUrl,
  inngestEmailLogger,
  loadClerkUserContact,
  sendTransactionalEmail,
  toEmailLocale,
} from '@/src/lib/inngest/functions/email-shared';

type InstructorRow = {
  id: string;
  name: string | null;
};

type ClientRow = {
  id: string;
  name: string | null;
};

export const welcomeClientEmail = inngest.createFunction(
  {
    id: 'agency-client-welcome-email',
    idempotency: 'event.id',
    retries: 5,
    triggers: [{ event: 'agency/client-welcome' }],
  },
  async ({ event, step }) => {
    const { agencyId, agencyName, userId, locale } = event.data as {
      agencyId: string;
      agencyName: string;
      userId: string;
      locale?: string;
    };

    inngestEmailLogger.info('[welcomeClientEmail] event', {
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
      inngestEmailLogger.warn('[welcomeClientEmail] no client found', { userId });
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
        return await loadClerkUserContact(clerk, userId);
      } catch (error) {
        inngestEmailLogger.error('[welcomeClientEmail] load-client-email error', error);
        return { email: null, name: null };
      }
    });

    const recipientEmail = clientClerk?.email ?? null;
    if (!recipientEmail) {
      inngestEmailLogger.warn('[welcomeClientEmail] no client email', {
        userId,
        agencyId,
      });
      return { skipped: true, reason: 'no_client_email' };
    }

    const lang = toEmailLocale(locale);
    const displayClientName =
      client?.name ||
      clientClerk?.name ||
      'Client';

    const subject =
      lang === 'fr'
        ? `Bienvenue chez ${agencyName}`
        : `Welcome to ${agencyName}`;

    const baseUrl = getAppBaseUrl();
    const actionUrl = buildLocalizedAppUrl(lang, '/book');
    const manageUrl = buildLocalizedAppUrl(lang, '/reservations');

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
      inngestEmailLogger.info('[welcomeClientEmail] sending email', {
        to: recipientEmail,
        subject,
        agencyId,
        agencyName,
      });

      return sendTransactionalEmail({
        eventId: event.id,
        html,
        subject,
        to: recipientEmail,
      });
    });

    inngestEmailLogger.info('[welcomeClientEmail] send-email result', result);

    if ((result as any)?.error) {
      inngestEmailLogger.error('[welcomeClientEmail] send-email error', result);
      throw new Error('Resend error');
    }

    return {
      ok: true,
      provider: result,
      recipient: recipientEmail,
    };
  },
);
