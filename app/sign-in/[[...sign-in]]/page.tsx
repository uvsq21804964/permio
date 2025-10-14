// app/sign-up/[[...sign-up]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return <SignIn fallbackRedirectUrl="/agenda" forceRedirectUrl="/agenda" />;
}
