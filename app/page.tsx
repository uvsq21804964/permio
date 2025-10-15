// app/page.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  // 👇 await the promise
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  redirect('/accueil');
}
