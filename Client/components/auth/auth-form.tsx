'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

interface AuthFormProps {
  type: 'signin' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
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
          {type === 'signin' ? (
            <SignInButton mode="modal" forceRedirectUrl="/library">
              <Button className="w-full h-11 text-base" type="button">
                Sign In
              </Button>
            </SignInButton>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/library">
              <Button className="w-full h-11 text-base" type="button">
                Sign Up
              </Button>
            </SignUpButton>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Powered by Clerk
              </span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground px-2">
          {type === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                href="/sign-in"
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
