import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import { sql } from '@/lib/db';
import BookingInstructorNotificationEmail from '@/src/emails/bookingInstructorNotification';
import { inngest } from '@/src/lib/inngest/client';
import {
  buildLocalizedAppUrl,
  getAppBaseUrl,
  inngestEmailLogger,
  loadClerkUserContact,
  sendTransactionalEmail,
  toEmailLocale,
} from '@/src/lib/inngest/functions/email-shared';

type ClientRow = {
  id: string;
  name: string | null;
};

type ServiceRow = {
  id: number;
  name: string | null;
};

export const slotBookedInstructorEmail = inngest.createFunction(
  {
    id: 'slot-booked-instructor-email',
    idempotency: 'event.id',
    retries: 5,
    triggers: [{ event: 'slot/booked-instructor' }],
  },
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

      inngestEmailLogger.info('[slotBookedInstructorEmail] event', {
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

      const client = await step.run('load-client', async () => {
        const rows = await sql`
          SELECT id, name
          FROM "User"
          WHERE id = ${clientUserId}
          LIMIT 1
        `;
        return (rows?.[0] ?? null) as ClientRow | null;
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

      inngestEmailLogger.info('[slotBookedInstructorEmail] client', client);
      inngestEmailLogger.info('[slotBookedInstructorEmail] service', service);

      const clerk = await clerkClient();
      const instructorClerk = await step.run(
        'load-instructor-email',
        async () => {
          try {
            return await loadClerkUserContact(clerk, instructorUserId);
          } catch (error) {
            inngestEmailLogger.error(
              '[slotBookedInstructorEmail] load-instructor-email error',
              error,
            );
            return { email: null, name: null };
          }
        },
      );

      inngestEmailLogger.info(
        '[slotBookedInstructorEmail] instructorClerk',
        instructorClerk,
      );

      const recipientEmail = instructorClerk?.email ?? null;
      if (!recipientEmail) {
        inngestEmailLogger.warn('[slotBookedInstructorEmail] no instructor email', {
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
        service?.name || (lang === 'fr' ? 'une reservation' : 'a booking');

      const subject =
        lang === 'fr'
          ? `Nouvelle reservation par ${displayClientName} !`
          : `New booking by ${displayClientName} !`;

      const baseUrl = getAppBaseUrl();
      const agendaUrl = buildLocalizedAppUrl(lang, '/myweek');

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

      inngestEmailLogger.info('[slotBookedInstructorEmail] about to send email', {
        recipientEmail,
        subject,
      });

      const result = await step.run('send-email', async () => {
        return sendTransactionalEmail({
          eventId: event.id,
          html,
          subject,
          to: recipientEmail,
        });
      });

      inngestEmailLogger.info('[slotBookedInstructorEmail] send-email result', result);

      if ((result as any)?.error) {
        inngestEmailLogger.error('[slotBookedInstructorEmail] send-email error', result);
        throw new Error('Resend error');
      }

      return {
        ok: true,
        provider: result,
        recipient: recipientEmail,
        slotId,
      };
    } catch (error) {
      inngestEmailLogger.error('[slotBookedInstructorEmail] fatal error', error);
      throw error;
    }
  },
);
