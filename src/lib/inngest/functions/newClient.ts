import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import { sql } from '@/lib/db';
import NewClientEmail from '@/src/emails/newClient';
import { inngest } from '@/src/lib/inngest/client';
import {
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
  name: string | null;
};

type Recipient = {
  email: string | null;
  id: string;
  name: string | null;
};

export const newClientEmail = inngest.createFunction(
  {
    id: 'agency-member-joined-email',
    idempotency: 'event.id',
    retries: 5,
    triggers: [{ event: 'agency/member-joined' }],
  },
  async ({ event, step }) => {
    const { agencyId, agencyName, userId, locale } = event.data as {
      agencyId: string;
      agencyName: string;
      userId: string;
      locale?: string;
    };

    const instructors = await step.run('load-instructors', async () => {
      const rows = await sql`
        SELECT id, name
        FROM "User"
        WHERE "agencyId" = ${agencyId}
          AND role = 'instructor'
      `;
      return (rows ?? []) as InstructorRow[];
    });

    if (!instructors.length) {
      return { skipped: true, reason: 'no_instructors' };
    }

    const client = await step.run('load-client', async () => {
      const rows = await sql`
        SELECT name
        FROM "User"
        WHERE id = ${userId}
        LIMIT 1
      `;
      return (rows?.[0] ?? null) as ClientRow | null;
    });

    const clerk = await clerkClient();
    const instructorIds = instructors.map(
      (instructor: InstructorRow) => instructor.id,
    );
    const clerkUsers = await step.run('load-instructor-emails', async () => {
      return clerk.users.getUserList({
        userId: instructorIds,
        limit: instructorIds.length,
      });
    });

    const emailById: Record<string, string | null> = {};
    for (const clerkUser of clerkUsers.data) {
      emailById[clerkUser.id] =
        clerkUser.emailAddresses?.find(
          (entry: { emailAddress: string; id: string }) =>
            entry.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ??
        clerkUser.emailAddresses?.[0]?.emailAddress ??
        null;
    }

    const recipients: Recipient[] = instructors
      .map((instructor: InstructorRow) => ({
        id: instructor.id,
        name: instructor.name,
        email: emailById[instructor.id] ?? null,
      }))
      .filter(
        (entry: Recipient): entry is Recipient & { email: string } => !!entry.email,
      );

    inngestEmailLogger.info('[newClientEmail] recipients debug', {
      instructors,
      clerkUsersCount: clerkUsers.data.length,
      emailById,
      recipients,
    });

    if (!recipients.length) {
      inngestEmailLogger.warn('[newClientEmail] no recipients with email', {
        agencyId,
        instructorCount: instructors.length,
      });
      return { skipped: true, reason: 'no_emails' };
    }

    const clientClerk = await step.run('load-client-email', async () => {
      try {
        return await loadClerkUserContact(clerk, userId);
      } catch {
        return { email: null, name: null };
      }
    });

    const lang = toEmailLocale(locale);
    const displayClientName =
      client?.name ||
      clientClerk?.name ||
      (lang === 'fr' ? 'Nouveau client' : 'New client');

    const subject =
      lang === 'fr'
        ? `Nouveau client associe a ${agencyName} ! Felicitations !`
        : `New client connected to ${agencyName}`;

    const res = await step.run('send-email', async () => {
      inngestEmailLogger.info('[newClientEmail] sending email', {
        agencyId,
        recipients: recipients.map((recipient: Recipient) => recipient.email),
      });

      const results = [];
      for (const recipient of recipients) {
        const html = await render(
          NewClientEmail({
            firstName: recipient.name || undefined,
            locale: lang,
          }),
        );

        const result = await sendTransactionalEmail({
          eventId: event.id,
          html,
          subject,
          to: recipient.email as string,
        });

        results.push(result);
      }

      return results;
    });

    inngestEmailLogger.info('[newClientEmail] send-email result', res);

    const firstError = Array.isArray(res)
      ? res.find((item) => (item as any)?.error)
      : (res as any)?.error
        ? res
        : null;
    if (firstError) {
      inngestEmailLogger.error('[newClientEmail] send-email error', res);
      throw new Error('Resend error');
    }

    return {
      ok: true,
      displayClientName,
      provider: res,
      recipients: recipients.length,
    };
  },
);
