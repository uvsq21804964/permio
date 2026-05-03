import { clerkClient } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import { sql } from '@/lib/db';
import { getSlotReminderDetails } from '@/lib/server/repositories/slot-repository';
import BookingClientReminderEmail from '@/src/emails/bookingClientReminder';
import { inngest } from '@/src/lib/inngest/client';
import {
  buildLocalizedAppUrl,
  inngestEmailLogger,
  loadClerkUserContact,
  loadTrainerContactDetails,
  sendTransactionalEmail,
  toEmailLocale,
} from '@/src/lib/inngest/functions/email-shared';

type ReminderSchedule = {
  sendAtIso: string | null;
  startsAtIso: string | null;
};

const REMINDER_PRIMARY_HOURS = 24;
const REMINDER_FALLBACK_HOURS = 2;

export const slotReminderClientEmail = inngest.createFunction(
  {
    id: 'slot-reminder-client-email',
    idempotency: 'event.id',
    retries: 5,
    triggers: [{ event: 'slot/booked-client' }],
  },
  async ({ event, step }) => {
    const { slotId, clientUserId, date, startTime, locale } = event.data as {
      slotId: number | string;
      clientUserId: string;
      date: string;
      startTime: string;
      locale?: string;
    };

    const lang = toEmailLocale(locale);

    const schedule = await step.run('compute-reminder-schedule', async () => {
      const rows = await sql`
        WITH slot_time AS (
          SELECT
            ((${date}::date + ${startTime}::time) AT TIME ZONE 'Europe/Paris') AS starts_at
        )
        SELECT
          starts_at::timestamptz::text AS "startsAtIso",
          CASE
            WHEN (starts_at - (${REMINDER_PRIMARY_HOURS} * INTERVAL '1 hour')) > NOW()
              THEN (starts_at - (${REMINDER_PRIMARY_HOURS} * INTERVAL '1 hour'))::timestamptz::text
            WHEN (starts_at - (${REMINDER_FALLBACK_HOURS} * INTERVAL '1 hour')) > NOW()
              THEN (starts_at - (${REMINDER_FALLBACK_HOURS} * INTERVAL '1 hour'))::timestamptz::text
            ELSE NULL
          END AS "sendAtIso"
        FROM slot_time
      `;

      return (rows?.[0] ?? {
        sendAtIso: null,
        startsAtIso: null,
      }) as ReminderSchedule;
    });

    inngestEmailLogger.info('[slotReminderClientEmail] schedule', {
      slotId,
      sendAtIso: schedule.sendAtIso,
      startsAtIso: schedule.startsAtIso,
    });

    if (!schedule.sendAtIso) {
      return { skipped: true, reason: 'too_close_to_start' };
    }

    await step.sleepUntil('wait-before-reminder', schedule.sendAtIso);

    const details = await step.run('load-slot-details', async () => {
      return getSlotReminderDetails(slotId);
    });

    if (!details) {
      inngestEmailLogger.warn(
        '[slotReminderClientEmail] slot missing, skipping',
        {
          slotId,
        },
      );
      return { skipped: true, reason: 'slot_missing' };
    }

    const clerk = await clerkClient();
    const instructorContact = await step.run(
      'load-instructor-contact',
      async () => loadTrainerContactDetails(clerk, details.instructorUserId),
    );
    const clientClerk = await step.run('load-client-email', async () => {
      try {
        return await loadClerkUserContact(clerk, clientUserId);
      } catch (error) {
        inngestEmailLogger.error(
          '[slotReminderClientEmail] load-client-email error',
          error,
        );
        return { email: null, name: null };
      }
    });

    const recipientEmail = clientClerk?.email ?? null;
    if (!recipientEmail) {
      return { skipped: true, reason: 'no_client_email' };
    }

    const meetingAddress = [
      details.formattedAddress,
      details.postalCode && details.city
        ? `${details.postalCode} ${details.city}`
        : details.city,
      details.country,
    ]
      .filter(Boolean)
      .join(', ');

    const agendaUrl = buildLocalizedAppUrl(lang, '/myweek');
    const subject = `Reminder: your session on ${details.date} at ${details.startTime}`;

    const html = await step.run('render-email', async () => {
      return render(
        BookingClientReminderEmail({
          agendaUrl,
          agencyName: details.agencyName,
          firstName: clientClerk?.name,
          instructorName: instructorContact?.name || details.instructorName,
          instructorEmail: instructorContact?.email || undefined,
          instructorPhone: instructorContact?.phoneDisplay || undefined,
          instructorPhoneHref: instructorContact?.phoneHref || undefined,
          locale: lang,
          meetingAddress: meetingAddress || null,
          serviceName: details.serviceName,
          date: details.date,
          startTime: details.startTime,
          endTime: details.endTime,
        }),
      );
    });

    const result = await step.run('send-email', async () => {
      return sendTransactionalEmail({
        eventId: `${event.id}:reminder`,
        html,
        subject,
        to: recipientEmail,
      });
    });

    if ((result as any)?.error) {
      inngestEmailLogger.error(
        '[slotReminderClientEmail] send-email error',
        result,
      );
      throw new Error('Resend error');
    }

    return {
      ok: true,
      recipient: recipientEmail,
      slotId,
      scheduledAt: schedule.sendAtIso,
    };
  },
);
