// src/lib/inngest/functions/slotBookedClientEmail.ts
import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { inngest } from '@/src/lib/inngest/client';
import { resend, EMAIL_FROM } from '@/src/lib/email/resend';
import { render } from '@react-email/render';
import BookingClientConfirmationEmail from '@/src/emails/bookingClientConfirmation';

type InstructorRow = {
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

export const slotBookedClientEmail = inngest.createFunction(
  {
    id: 'slot-booked-client-email',
    idempotency: 'event.id',
    retries: 5,
  },
  { event: 'slot/booked-client' },
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

      console.info('[slotBookedClientEmail] event', {
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

      const instructor = await step.run('load-instructor', async () => {
        const rows = await sql`
        SELECT id, name
        FROM "User"
        WHERE id = ${instructorUserId}
        LIMIT 1
      `;
        return (rows?.[0] ?? null) as InstructorRow | null;
      });

      const service = await step.run('load-service', async () => {
        const rows = await sql`
    SELECT id, name
    FROM services_pricing
    WHERE id = ${serviceId}
    LIMIT 1
  `;
        return (rows?.[0] ?? null) as ServiceRow | null;
      });
      console.info('[slotBookedClientEmail] service', service);
      const clerk = await clerkClient();

      const clientClerk = await step.run('load-client-email', async () => {
        try {
          const cu = await clerk.users.getUser(clientUserId);

          return {
            email: getPrimaryEmail(cu),
            name:
              [cu.firstName, cu.lastName].filter(Boolean).join(' ').trim() ||
              cu.username ||
              null,
          };
        } catch (error) {
          console.error(
            '[slotBookedClientEmail] load-client-email error',
            error,
          );
          return { email: null, name: null };
        }
      });

      const recipientEmail = clientClerk?.email ?? null;

      if (!recipientEmail) {
        console.warn('[slotBookedClientEmail] no client email', {
          clientUserId,
          agencyId,
          slotId,
        });
        return { skipped: true, reason: 'no_client_email' };
      }

      const displayClientName =
        clientClerk?.name || (lang === 'fr' ? 'Client' : 'Client');

      const displayServiceName =
        service?.name || (lang === 'fr' ? 'votre réservation' : 'your booking');

      const subject =
        lang === 'fr'
          ? `Réservation confirmée chez ${agencyName}`
          : `Booking confirmed with ${agencyName}`;

      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(
        /\/+$/,
        '',
      );

      const reservationsUrl = baseUrl
        ? `${baseUrl}/${lang}/reservations`
        : 'http://localhost:3000';

      const html = await step.run('render-email', async () => {
        return render(
          BookingClientConfirmationEmail({
            firstName: displayClientName,
            agencyName,
            locale: lang,
            reservationsUrl,
            instructorName: instructor?.name || undefined,
            serviceName: displayServiceName,
            date,
            startTime,
            endTime,
            appUrl: baseUrl || 'http://localhost:3000',
          }),
        );
      });

      const result = await step.run('send-email', async () => {
        console.info('[slotBookedClientEmail] sending email', {
          to: recipientEmail,
          subject,
          slotId,
          agencyId,
        });

        return resend.emails.send({
          from: EMAIL_FROM,
          to: recipientEmail,
          subject,
          html,
          ...(event.id ? { headers: { 'X-Event-Id': event.id } } : {}),
        });
      });

      console.info('[slotBookedClientEmail] send-email result', result);

      if ((result as any)?.error) {
        console.error('[slotBookedClientEmail] send-email error', result);
        throw new Error('Resend error');
      }

      return {
        ok: true,
        slotId,
        recipient: recipientEmail,
        provider: result,
      };
    } catch (error) {
      console.error('[slotBookedClientEmail] fatal error', error);
      throw error;
    }
  },
);
