import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import BookingClientCancellationEmail from '@/src/emails/bookingClientCancellation';
import { inngest } from '@/src/lib/inngest/client';
import {
  buildLocalizedAppUrl,
  inngestEmailLogger,
  loadClerkUserContact,
  loadTrainerContactDetails,
  sendTransactionalEmail,
  toEmailLocale,
} from '@/src/lib/inngest/functions/email-shared';

export const slotCancelledClientEmail = inngest.createFunction(
  {
    id: 'slot-cancelled-client-email',
    idempotency: 'event.id',
    retries: 5,
    triggers: [{ event: 'slot/cancelled-client' }],
  },
  async ({ event, step }) => {
    const data = event.data as {
      slotId: number | string;
      agencyName: string | null;
      instructorUserId: string;
      instructorName: string | null;
      clientUserId: string;
      serviceName: string | null;
      date: string;
      startTime: string;
      endTime: string;
      formattedAddress: string | null;
      cancelledByName: string | null;
      cancelledByRole: string | null;
      locale?: string;
    };

    const lang = toEmailLocale(data.locale);
    const clerk = await clerkClient();
    const instructorContact = await step.run('load-instructor-contact', async () =>
      loadTrainerContactDetails(clerk, data.instructorUserId),
    );

    const clientContact = await step.run('load-client-email', async () => {
      try {
        return await loadClerkUserContact(clerk, data.clientUserId);
      } catch (error) {
        inngestEmailLogger.error(
          '[slotCancelledClientEmail] load-client-email error',
          error,
        );
        return { email: null, name: null };
      }
    });

    const recipientEmail = clientContact.email;
    if (!recipientEmail) {
      return { skipped: true, reason: 'no_client_email' };
    }

    const subject =
      lang === 'fr'
        ? `Annulation de votre séance${data.agencyName ? ` chez ${data.agencyName}` : ''}`
        : `Your lesson was cancelled${data.agencyName ? ` with ${data.agencyName}` : ''}`;

    const html = await step.run('render-email', async () =>
      render(
        BookingClientCancellationEmail({
          firstName: clientContact.name,
          agencyName: data.agencyName,
          locale: lang,
          instructorName: instructorContact?.name || data.instructorName,
          instructorEmail: instructorContact?.email || undefined,
          instructorPhone: instructorContact?.phoneDisplay || undefined,
          instructorPhoneHref: instructorContact?.phoneHref || undefined,
          serviceName: data.serviceName,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          address: data.formattedAddress,
          cancelledByName: data.cancelledByName,
          cancelledByRole: data.cancelledByRole,
          scheduleUrl: buildLocalizedAppUrl(lang, '/myweek'),
        }),
      ),
    );

    const result = await step.run('send-email', async () =>
      sendTransactionalEmail({
        eventId: event.id,
        html,
        subject,
        to: recipientEmail,
      }),
    );

    if ((result as any)?.error) {
      throw new Error('Resend error');
    }

    return { ok: true, recipient: recipientEmail, slotId: data.slotId };
  },
);
