import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from 'next/server';
import { logger } from './logger';

export const auth0 = new Auth0Client({
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
  },
  // After successful sign-in, redirect users to the library by default
  signInReturnToPath: '/library',
  // Request access token with API audience
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
  // onCallback hook allows custom redirects after authentication
  onCallback: async (_error, ctx) => {
    try {
      // Log returnTo for debugging so we can see what Auth0 provided
      // (This can be removed after verification)
  logger.log('Auth0 onCallback returnTo:', ctx?.returnTo);
      const destination = ctx?.returnTo || '/library';
      // Next.js middleware requires absolute URLs. Build one using APP_BASE_URL.
      const base = process.env.APP_BASE_URL || 'http://localhost:3000';
      const redirectUrl = new URL(destination, base).toString();
      return NextResponse.redirect(redirectUrl);
    } catch (e) {
      logger.error('onCallback redirect error', e);
      const base = process.env.APP_BASE_URL || 'http://localhost:3000';
      return NextResponse.redirect(new URL('/', base).toString());
    }
  },
});