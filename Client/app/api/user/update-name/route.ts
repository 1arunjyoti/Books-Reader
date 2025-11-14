import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import { API_ENDPOINTS } from '@/lib/config';

const API_BASE_URL = API_ENDPOINTS.BASE;

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"{}`]/g, '') // Remove HTML/template characters
    .substring(0, 25); // Limit to 25 characters
}

/**
 * POST /api/user/update-name
 * Update user display name
 * 
 * Security:
 * - JWT authentication required
 * - Input validation and sanitization
 * - Rate limited on backend
 * 
 * Performance:
 * - Optimized for fast updates
 * - Minimal database operations
 */
export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const accessToken = session.tokenSet?.accessToken || session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Validate request body
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedName = sanitizeInput(body.name);
    
    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    // Forward the request to the backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/update-name`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BooksReader-Client/1.0',
        },
        body: JSON.stringify({ name: sanitizedName }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return NextResponse.json(
          data || { error: 'Failed to update name' },
          { status: response.status }
        );
      }

      // Invalidate cache after successful update
      revalidateTag('user-profile');

      // Add security headers
      const successResponse = NextResponse.json(data);
      successResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      successResponse.headers.set('X-Content-Type-Options', 'nosniff');
      
      return successResponse;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error('Error updating name:', error);
    return NextResponse.json(
      { error: 'Failed to update name' },
      { status: 500 }
    );
  }
}
