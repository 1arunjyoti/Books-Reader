import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that require authentication
// All other routes are public by default (/, /about, /privacy, /terms, /contact, /sign-in, /sign-up)
const isProtectedRoute = createRouteMatcher([
  '/library(.*)',      // Library and all sub-routes (collections, read, etc.)
  '/profile(.*)',      // User profile and settings
  '/welcome(.*)',      // Welcome/onboarding screen
  '/api/auth/token(.*)', // Token endpoint
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  // Unauthenticated users will be redirected to sign-in
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};