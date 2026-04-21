import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import { sql } from '@/lib/db';
import BookingClientConfirmationEmail from '@/src/emails/bookingClientConfirmation';
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

type ServiceRow = {
  id: number;
  name: string | null;
};

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

      inngestEmailLogger.info('[slotBookedClientEmail] event', {
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

      const lang = toEmailLocale(locale);

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

      inngestEmailLogger.info('[slotBookedClientEmail] service', service);

      const clerk = await clerkClient();
      const clientClerk = await step.run('load-client-email', async () => {
        try {
          return await loadClerkUserContact(clerk, clientUserId);
        } catch (error) {
          inngestEmailLogger.error(
            '[slotBookedClientEmail] load-client-email error',
            error,
          );
          return { email: null, name: null };
        }
      });

      const recipientEmail = clientClerk?.email ?? null;
      if (!recipientEmail) {
        inngestEmailLogger.warn('[slotBookedClientEmail] no client email', {
          clientUserId,
          agencyId,
          slotId,
        });
        return { skipped: true, reason: 'no_client_email' };
      }

      const displayClientName = clientClerk?.name || 'Client';
      const displayServiceName =
        service?.name || (lang === 'fr' ? 'votre reservation' : 'your booking');
      const subject =
        lang === 'fr'
          ? `Reservation confirmee chez ${agencyName}`
          : `Booking confirmed with ${agencyName}`;

      const baseUrl = getAppBaseUrl();
      const reservationsUrl = buildLocalizedAppUrl(lang, '/reservations');

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
        inngestEmailLogger.info('[slotBookedClientEmail] sending email', {
          agencyId,
          slotId,
          subject,
          to: recipientEmail,
        });

        return sendTransactionalEmail({
          eventId: event.id,
          html,
          subject,
          to: recipientEmail,
        });
      });

      inngestEmailLogger.info('[slotBookedClientEmail] send-email result', result);

      if ((result as any)?.error) {
        inngestEmailLogger.error('[slotBookedClientEmail] send-email error', result);
        throw new Error('Resend error');
      }

      return {
        ok: true,
        provider: result,
        recipient: recipientEmail,
        slotId,
      };
    } catch (error) {
      inngestEmailLogger.error('[slotBookedClientEmail] fatal error', error);
      throw error;
    }
  },
);
