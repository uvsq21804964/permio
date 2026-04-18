// src/lib/inngest/functions/newClient.tsx

import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { inngest } from '@/src/lib/inngest/client';
import { resend, EMAIL_FROM } from '@/src/lib/email/resend';
import { render } from '@react-email/render';
import NewClientEmail from '@/src/emails/newClient';

type InstructorRow = {
  id: string;
  name: string | null;
};

type ClientRow = {
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

/**
 * Event attendu:
 * {
 *   name: "agency/member-joined",
 *   data: { agencyId, agencyName, userId, locale }
 * }
 */
export const newClientEmail = inngest.createFunction(
  {
    id: 'agency-member-joined-email',
    idempotency: 'event.id',
    retries: 5,
  },
  { event: 'agency/member-joined' },
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

    const instructorIds = instructors.map((i) => i.id);
    const clerkUsers = await step.run('load-instructor-emails', async () => {
      return clerk.users.getUserList({
        userId: instructorIds,
        limit: instructorIds.length,
      });
    });

    const emailById: Record<string, string | null> = {};
    for (const cu of clerkUsers.data) {
      emailById[cu.id] = getPrimaryEmail(cu);
    }

    const recipients = instructors
      .map((i) => ({
        id: i.id,
        name: i.name,
        email: emailById[i.id] ?? null,
      }))
      .filter((i) => !!i.email);

    console.info('[newClientEmail] recipients debug', {
      instructors,
      clerkUsersCount: clerkUsers.data.length,
      emailById,
      recipients,
    });

    if (!recipients.length) {
      console.warn('[newClientEmail] no recipients with email', {
        agencyId,
        instructorCount: instructors.length,
      });
      return { skipped: true, reason: 'no_emails' };
    }

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
      } catch {
        return { email: null, name: null };
      }
    });

    const displayClientName =
      client?.name ||
      clientClerk?.name ||
      (locale?.startsWith('fr') ? 'Nouveau client' : 'New client');

    const subject = locale?.startsWith('fr')
      ? `Nouveau client associé à ${agencyName} ! Félicitations !`
      : `New client connected to ${agencyName}`;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
    const actionUrl = baseUrl
      ? `${baseUrl}/${(locale || 'fr').startsWith('fr') ? 'fr' : 'en'}/myweek`
      : 'http://localhost:3000';

    const res = await step.run('send-email', async () => {
      console.info('[newClientEmail] sending email', {
        agencyId,
        recipients: recipients.map((r) => r.email),
      });
      const results = [];
      for (const recipient of recipients) {
        const html = await render(
          NewClientEmail({
            firstName: recipient.name || undefined,
            locale: (locale || 'fr').startsWith('fr') ? 'fr' : 'en',
          }),
        );

        const result = await resend.emails.send({
          from: EMAIL_FROM,
          to: recipient.email as string,
          subject,
          html,
          ...(event.id ? { headers: { 'X-Event-Id': event.id } } : {}),
        });
        results.push(result);
      }
      return results;
    });

    console.info('[newClientEmail] send-email result', res);
    const firstError = Array.isArray(res)
      ? res.find((item) => (item as any)?.error)
      : (res as any)?.error
        ? res
        : null;
    if (firstError) {
      console.error('[newClientEmail] send-email error', res);
      throw new Error('Resend error');
    }
    return { ok: true, provider: res, recipients: recipients.length };
  },
);
