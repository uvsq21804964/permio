// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';

export const runtime = 'nodejs'; // Stripe SDK = Node obligatoire
export const dynamic = 'force-dynamic'; // pas de cache

function getPrimaryEmail(user: any): string | undefined {
  const id = user?.primaryEmailAddressId;
  return user?.emailAddresses?.find((e: any) => e.id === id)?.emailAddress;
}

// Construit un return_url fiable si NEXT_PUBLIC_APP_URL n'est pas défini
function makeReturnUrl(req: Request, fallbackPath = '/billing') {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
  if (envBase) return `${envBase}${fallbackPath}`;
  try {
    const u = new URL(req.url);
    return `${u.origin}${fallbackPath}`;
  } catch {
    return fallbackPath;
  }
}

export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[portal] Missing STRIPE_SECRET_KEY');
      return new NextResponse(
        isDev ? 'Missing STRIPE_SECRET_KEY' : 'Internal Server Error',
        { status: 500 }
      );
    }

    const clerk = await getClerkClient();
    const user = await clerk.users.getUser(userId);

    // 1) Récupérer/persister le customerId
    let customerId = (user.privateMetadata as any)?.stripeCustomerId as
      | string
      | undefined;

    if (!customerId) {
      const email = getPrimaryEmail(user);
      if (email) {
        const found = await stripe.customers.search({
          query: `email:'${email.replace(/'/g, "\\'")}'`,
          limit: 1,
        });
        const hit = found.data[0];
        if (hit?.id) {
          customerId = hit.id;
          // Persistance Clerk
          await clerk.users.updateUser(userId, {
            privateMetadata: {
              ...(user.privateMetadata || {}),
              stripeCustomerId: customerId,
            },
          });
        }
      }
    }

    if (!customerId) {
      console.error('[portal] No Stripe customer for user', { userId });
      return new NextResponse(
        isDev ? 'No Stripe customer (check session_id/webhook)' : 'Bad Request',
        { status: 400 }
      );
    }

    // 2) Vérifier le customer côté Stripe (détecte mismatch test/live)
    try {
      await stripe.customers.retrieve(customerId);
    } catch (e: any) {
      console.error('[portal] customers.retrieve failed', {
        customerId,
        msg: e?.message,
      });
      return new NextResponse(
        isDev
          ? `Stripe customer not found: ${customerId} (check test/live key)`
          : 'Bad Request',
        { status: 400 }
      );
    }

    // 3) return_url (priorité au formulaire)
    let returnUrl = makeReturnUrl(req, '/billing');
    try {
      const form = await req.formData();
      const fromForm = form.get('returnUrl');
      if (typeof fromForm === 'string' && fromForm.trim()) {
        returnUrl = fromForm;
      }
    } catch {
      /* ignore */
    }

    // 4) Créer la session Billing Portal
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.redirect(portal.url, { status: 303 });
  } catch (err: any) {
    // Log détaillé serveur
    console.error('[portal] Unhandled error', {
      msg: err?.message,
      stack: err?.stack,
    });
    // Message neutre en prod, verbeux en dev
    return new NextResponse(
      process.env.NODE_ENV !== 'production'
        ? `Portal error: ${err?.message || 'unknown'}`
        : 'Internal Server Error',
      { status: 500 }
    );
  }
}
