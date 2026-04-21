import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import BookingInstructorCancellationEmail from '@/src/emails/bookingInstructorCancellation';
import { inngest } from '@/src/lib/inngest/client';
import {
  buildLocalizedAppUrl,
  inngestEmailLogger,
  loadClerkUserContact,
  sendTransactionalEmail,
  toEmailLocale,
} from '@/src/lib/inngest/functions/email-shared';

export const slotCancelledInstructorEmail = inngest.createFunction(
  {
    id: 'slot-cancelled-instructor-email',
    idempotency: 'event.id',
    retries: 5,
  },
  { event: 'slot/cancelled-instructor' },
  async ({ event, step }) => {
    const data = event.data as {
      slotId: number | string;
      agencyName: string | null;
      instructorUserId: string;
      clientName: string | null;
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

    const instructorContact = await step.run('load-instructor-email', async () => {
      try {
        return await loadClerkUserContact(clerk, data.instructorUserId);
      } catch (error) {
        inngestEmailLogger.error(
          '[slotCancelledInstructorEmail] load-instructor-email error',
          error,
        );
        return { email: null, name: null };
      }
    });

    const recipientEmail = instructorContact.email;
    if (!recipientEmail) {
      return { skipped: true, reason: 'no_instructor_email' };
    }

    const subject =
      lang === 'fr'
        ? `Annulation d'un créneau${data.clientName ? ` avec ${data.clientName}` : ''}`
        : `A slot was cancelled${data.clientName ? ` with ${data.clientName}` : ''}`;

    const html = await step.run('render-email', async () =>
      render(
        BookingInstructorCancellationEmail({
          firstName: instructorContact.name,
          agencyName: data.agencyName,
          locale: lang,
          clientName: data.clientName,
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
