import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

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
        <Link href={signedOutHref} className={className}>
          {signedOutLabel}
        </Link>
      </SignedOut>

      <SignedIn>
        <Link href={signedInHref} className={className}>
          {signedInLabel}
        </Link>
      </SignedIn>
    </>
  );
}
