import { Inngest } from 'inngest';

const eventKey = process.env.INNGEST_EVENT_KEY;
const signingKey = process.env.INNGEST_SIGNING_KEY;
const signingKeyFallback = process.env.INNGEST_SIGNING_KEY_FALLBACK;
const env = process.env.INNGEST_ENV || 'production';

if (!eventKey) {
  throw new Error('Missing INNGEST_EVENT_KEY');
}

if (!signingKey) {
  throw new Error('Missing INNGEST_SIGNING_KEY');
}

export const inngest = new Inngest({
  id: 'magichango-app',
  eventKey,
  signingKey,
  signingKeyFallback,
  env,
});
