// src/lib/inngest/functions/slotBookedInstructorEmail.ts
import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { inngest } from '@/src/lib/inngest/client';
import { resend, EMAIL_FROM } from '@/src/lib/email/resend';
import { render } from '@react-email/render';
import BookingInstructorNotificationEmail from '@/src/emails/bookingInstructorNotification';

type ClientRow = {
  id: string;
  name: string | null;
};

type ServiceRow = {
  id: number;
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

export const slotBookedInstructorEmail = inngest.createFunction(
  {
    id: 'slot-booked-instructor-email',
    idempotency: 'event.id',
    retries: 5,
  },
  { event: 'slot/booked-instructor' },
  async ({ event, step }) => {
    try {
      const {
        slotId,
        agencyId,
        agencyName,
        instructorUserId,
        clientUserId,
        serviceId,
        date,
        startTime,
        endTime,
        locale,
      } = event.data as {
        slotId: number | string;
        agencyId: string;
        agencyName: string;
        organizationId?: string | null;
        instructorUserId: string;
        clientUserId: string;
        serviceId: number;
        date: string;
        startTime: string;
        endTime: string;
        locale?: string;
      };

      console.info('[slotBookedInstructorEmail] event', {
        id: event.id,
        slotId,
        agencyId,
        agencyName,
        instructorUserId,
        clientUserId,
        serviceId,
        date,
        startTime,
        endTime,
        locale,
      });

      const lang = (locale || 'fr').toLowerCase().startsWith('en')
        ? 'en'
        : 'fr';

      const client = await step.run('load-client', async () => {
        const rows = await sql`
          SELECT id, name
          FROM "User"
          WHERE id = ${clientUserId}
          LIMIT 1
        `;
        return (rows?.[0] ?? null) as ClientRow | null;
      });

      console.info('[slotBookedInstructorEmail] client', client);

      const service = await step.run('load-service', async () => {
        const rows = await sql`
          SELECT id, name
          FROM services_pricing
          WHERE id = ${serviceId}
          LIMIT 1
        `;
        return (rows?.[0] ?? null) as ServiceRow | null;
      });

      console.info('[slotBookedInstructorEmail] service', service);

      const clerk = await clerkClient();

      const instructorClerk = await step.run(
        'load-instructor-email',
        async () => {
          try {
            const iu = await clerk.users.getUser(instructorUserId);

            return {
              email: getPrimaryEmail(iu),
              name:
                [iu.firstName, iu.lastName].filter(Boolean).join(' ').trim() ||
                iu.username ||
                null,
            };
          } catch (error) {
            console.error(
              '[slotBookedInstructorEmail] load-instructor-email error',
              error,
            );
            return { email: null, name: null };
          }
        },
      );

      console.info(
        '[slotBookedInstructorEmail] instructorClerk',
        instructorClerk,
      );

      const recipientEmail = instructorClerk?.email ?? null;

      if (!recipientEmail) {
        console.warn('[slotBookedInstructorEmail] no instructor email', {
          instructorUserId,
          agencyId,
          slotId,
        });
        return { skipped: true, reason: 'no_instructor_email' };
      }

      const displayInstructorName =
        instructorClerk?.name || (lang === 'fr' ? 'Éducateur' : 'Trainer');

      const displayClientName =
        client?.name?.trim() || (lang === 'fr' ? 'Un client' : 'A client');

      const displayServiceName =
        service?.name || (lang === 'fr' ? 'une réservation' : 'a booking');

      const subject =
        lang === 'fr'
          ? `Nouvelle réservation par ${displayClientName} !`
          : `New booking par ${displayClientName} !`;

      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(
        /\/+$/,
        '',
      );

      const agendaUrl = baseUrl
        ? `${baseUrl}/${lang}/myweek`
        : 'http://localhost:3000';

      const html = await step.run('render-email', async () => {
        return render(
          BookingInstructorNotificationEmail({
            firstName: displayInstructorName,
            agencyName,
            locale: lang,
            agendaUrl,
            clientName: displayClientName,
            serviceName: displayServiceName,
            date,
            startTime,
            endTime,
            appUrl: baseUrl || 'http://localhost:3000',
          }),
        );
      });

      console.info('[slotBookedInstructorEmail] about to send email', {
        recipientEmail,
        subject,
      });

      const result = await step.run('send-email', async () => {
        return resend.emails.send({
          from: EMAIL_FROM,
          to: recipientEmail,
          subject,
          html,
          ...(event.id ? { headers: { 'X-Event-Id': event.id } } : {}),
        });
      });

      console.info('[slotBookedInstructorEmail] send-email result', result);

      if ((result as any)?.error) {
        console.error('[slotBookedInstructorEmail] send-email error', result);
        throw new Error('Resend error');
      }

      return {
        ok: true,
        slotId,
        recipient: recipientEmail,
        provider: result,
      };
    } catch (error) {
      console.error('[slotBookedInstructorEmail] fatal error', error);
      throw error;
    }
  },
);
