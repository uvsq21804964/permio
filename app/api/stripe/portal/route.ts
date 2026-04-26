// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';

import { stripe } from '@/lib/stripe';
import { resolveStripeCustomerId } from '@/lib/server/stripe-customer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function makeReturnUrl(req: Request, fallbackPath = '/invoices') {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
  if (envBase) return `${envBase}${fallbackPath}`;
  try {
    const url = new URL(req.url);
    return `${url.origin}${fallbackPath}`;
  } catch {
    return fallbackPath;
  }
}

function normalizePortalLocale(value: unknown): 'fr' | 'en' | 'auto' {
  if (typeof value !== 'string') return 'auto';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'fr' || normalized.startsWith('fr-')) return 'fr';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (normalized === 'auto') return 'auto';
  return 'auto';
}

function redirectWithPortalError(returnUrl: string, errorCode: string) {
  return NextResponse.redirect(`${returnUrl}?error=${errorCode}`, {
    status: 303,
  });
}

export async function POST(req: Request) {
  let returnUrl = '/invoices';

  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    let form: FormData | null = null;
    try {
      form = await req.formData();
    } catch {
      form = null;
    }

    const portalLocale = normalizePortalLocale(form?.get('portalLocale'));
    const fallbackPath =
      portalLocale === 'fr'
        ? '/fr/invoices'
        : portalLocale === 'en'
          ? '/en/invoices'
          : '/invoices';

    returnUrl = makeReturnUrl(req, fallbackPath);
    const fromForm = form?.get('returnUrl');
    if (typeof fromForm === 'string' && fromForm.trim()) {
      returnUrl = fromForm.trim();
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[portal] Missing STRIPE_SECRET_KEY');
      return redirectWithPortalError(returnUrl, 'portal_unavailable');
    }

    const clerk = await getClerkClient();
    const user = await clerk.users.getUser(userId);
    const customerId = await resolveStripeCustomerId({ user, userId });

    if (!customerId) {
      console.error('[portal] No Stripe customer for user', { userId });
      return redirectWithPortalError(returnUrl, 'missing_customer');
    }

    try {
      await stripe.customers.retrieve(customerId);
    } catch (error: any) {
      console.error('[portal] customers.retrieve failed', {
        customerId,
        msg: error?.message,
      });
      return redirectWithPortalError(returnUrl, 'invalid_customer');
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      locale: portalLocale === 'auto' ? 'auto' : portalLocale,
    } as any);

    return NextResponse.redirect(portal.url, { status: 303 });
  } catch (error: any) {
    console.error('[portal] Unhandled error', {
      msg: error?.message,
      stack: error?.stack,
    });
    return redirectWithPortalError(returnUrl, 'portal_failed');
  }
}
