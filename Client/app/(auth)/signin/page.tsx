'use server';

import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { AuthForm } from '@/components/auth/auth-form';

export default async function SignInPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  // Server-side check: if user is already authenticated, redirect to /library
  try {
    const session = await auth0.getSession();
    if (session && session.user) {
      redirect('/library');
    }
  } catch (err) {
    // ignore and render sign in page
    console.error('Error checking session on signin page:', err);
  }

  // searchParams is a Promise-aware object in App Router routes — await it before access.
  const sp = await searchParams;
  const returnTo = Array.isArray(sp?.returnTo) ? sp?.returnTo[0] : sp?.returnTo;

  return (
    <div className="mx-auto w-full max-w-md">
      {returnTo && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Please sign in to continue to your requested page.
          </p>
        </div>
      )}
      <AuthForm type="signin" />
    </div>
  );
}
