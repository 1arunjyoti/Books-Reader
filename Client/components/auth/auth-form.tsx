'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';

interface AuthFormProps {
  type: 'signin' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
  const handleAuth0Login = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      const url = returnTo ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}` : '/api/auth/login';
      window.location.href = url;
    } catch {
      window.location.href = '/api/auth/login';
    }
  };

  /* Handle Google login */
  const handleGoogleLogin = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      const base = `/api/auth/login?connection=google-oauth2`;
      const url = returnTo ? `${base}&returnTo=${encodeURIComponent(returnTo)}` : base;
      window.location.href = url;
    } catch {
      window.location.href = '/api/auth/login?connection=google-oauth2';
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto px-4 sm:px-6">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {type === 'signin' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-muted-foreground px-2">
            {type === 'signin' 
              ? 'Click below to sign in to your account' 
              : 'Click below to create your account'}
          </p>
        </div>
        <div className="space-y-4">
          <Button 
            onClick={handleAuth0Login} 
            className="w-full h-11 text-base"
            type="button"
          >
            {type === 'signin' ? 'Sign In with Auth0' : 'Sign Up with Auth0'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            type="button" 
            className="w-full h-11 text-base"
            onClick={handleGoogleLogin}
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground px-2">
          {type === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                href="/signin"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
        <p className="text-center text-xs text-muted-foreground px-2">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
