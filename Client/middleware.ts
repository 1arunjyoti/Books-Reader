import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';
import { logger } from './lib/logger';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  logger.log('[Middleware] Processing:', pathname);
  
  // Auth0 middleware handles /api/auth/* routes automatically
  // It also manages session cookies for all other routes
  const response = await auth0.middleware(request);
  
  logger.log('[Middleware] Auth0 response status:', response.status);
  
  // If the auth middleware handled the request (auth routes), return that response
  if (pathname.startsWith('/api/auth/')) {
    logger.log('[Middleware] Returning Auth0 response for auth route');
    return response;
  }
  
  // For protected routes, check authentication
  const protectedRoutes = ['/library', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    try {
      const session = await auth0.getSession(request);
      
      if (!session || !session.user) {
        // User is not authenticated, redirect to sign in
        logger.log('[Middleware] No session found, redirecting to signin');
        const signInUrl = new URL('/signin', request.url);
        signInUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      logger.error('[Middleware] Auth error:', error);
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
