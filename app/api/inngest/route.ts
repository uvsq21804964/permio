// app / api / inngest / route.ts

import { serve } from 'inngest/next';
import { inngest } from '@/src/lib/inngest/client';
import { newClientEmail } from '@/src/lib/inngest/functions/newClient';
import { welcomeClientEmail } from '@/src/lib/inngest/functions/welcomeClientEmail';
import { slotBookedClientEmail } from '@/src/lib/inngest/functions/slotBookedClientEmail';
import { slotBookedInstructorEmail } from '@/src/lib/inngest/functions/slotBookedInstructorEmail';
import { slotReminderClientEmail } from '@/src/lib/inngest/functions/slotReminderClientEmail';
import { slotCancelledClientEmail } from '@/src/lib/inngest/functions/slotCancelledClientEmail';
import { slotCancelledInstructorEmail } from '@/src/lib/inngest/functions/slotCancelledInstructorEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const {
  GET: rawGET,
  POST: rawPOST,
  PUT: rawPUT,
} = serve({
  client: inngest,
  functions: [
    newClientEmail,
    welcomeClientEmail,
    slotBookedClientEmail,
    slotBookedInstructorEmail,
    slotReminderClientEmail,
    slotCancelledClientEmail,
    slotCancelledInstructorEmail,
  ],
});

const withErrorLogging =
  (fn: (...args: any[]) => Promise<Response>) =>
  async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('[api/inngest] handler error', error);
      throw error;
    }
  };

export const GET = withErrorLogging(rawGET);
export const POST = withErrorLogging(rawPOST);
export const PUT = withErrorLogging(rawPUT);
