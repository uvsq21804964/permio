'use client';

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

import { trackButtonClick } from '@/lib/client/button-tracking';

type AuthAwareBlogActionProps = {
  className: string;
  signedInHref: string;
  signedInLabel: string;
  signedOutHref: string;
  signedOutLabel: string;
};

export function AuthAwareBlogAction({
  className,
  signedInHref,
  signedInLabel,
  signedOutHref,
  signedOutLabel,
}: AuthAwareBlogActionProps) {
  return (
    <>
      <SignedOut>
        <Link
          href={signedOutHref}
          className={className}
          onClick={() => {
            trackButtonClick({
              buttonKey: 'blog_cta_signed_out',
              buttonLabel: signedOutLabel,
              buttonContext: 'blog',
              targetHref: signedOutHref,
            });
          }}
        >
          {signedOutLabel}
        </Link>
      </SignedOut>

      <SignedIn>
        <Link
          href={signedInHref}
          className={className}
          onClick={() => {
            trackButtonClick({
              buttonKey: 'blog_cta_signed_in',
              buttonLabel: signedInLabel,
              buttonContext: 'blog',
              targetHref: signedInHref,
            });
          }}
        >
          {signedInLabel}
        </Link>
      </SignedIn>
    </>
  );
}
