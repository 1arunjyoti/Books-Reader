import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Determine environment
  const isProduction = process.env.NODE_ENV === 'production';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // CSP Policy
  // Note: We balance security with functionality by allowing necessary third-party scripts
  // For Clerk to work properly, we need both nonce and allowlist-based sources
  // 
  // CRITICAL CSP BEHAVIOR:
  // - When 'nonce-...' is present in script-src, 'unsafe-inline' is IGNORED by browsers
  // - This is intentional security behavior per CSP Level 3 spec
  // - To allow inline scripts from third-parties (Vercel Analytics, Clerk), we MUST use 'unsafe-inline' WITHOUT nonce
  // 
  // Security Trade-off:
  // - We use 'unsafe-inline' for scripts to support third-party libraries
  // - Still protected by strict domain allowlist
  // - XSS risk is mitigated through other layers (input sanitization, domain restrictions)
  // 
  // Development vs Production:
  // - Development: Allows both HTTP and HTTPS for localhost (no upgrade-insecure-requests)
  // - Production: Forces HTTPS via upgrade-insecure-requests
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://unpkg.com https://*.clerk.accounts.dev https://clerk.com https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline' blob: https://*.clerk.accounts.dev;
    img-src 'self' blob: data: https:;
    font-src 'self' data: blob:;
    connect-src 'self' blob: ${apiUrl} ${apiUrl.replace('http://', 'https://')} https://va.vercel-scripts.com https://*.backblazeb2.com https://unpkg.com https://*.clerk.accounts.dev https://api.clerk.com https://clerk-telemetry.com https://clerk.com https://challenges.cloudflare.com wss://*.clerk.accounts.dev;
    worker-src 'self' blob: https://unpkg.com;
    child-src 'self' blob:;
    frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProduction ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};