import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { API_ENDPOINTS } from '@/lib/config';

const API_BASE_URL = API_ENDPOINTS.BASE;

/**
 * POST /api/user/delete
 * Delete user account permanently
 * 
 * Security:
 * - Requires valid session with JWT token
 * - Password verification required
 * - Email confirmation required
 * 
 * This will:
 * - Delete all user data from database (books, bookmarks, annotations, etc.)
 * - Delete all files from B2 cloud storage
 * - Delete user from Auth0
 * - Clear session
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
        { error: 'Access token not available' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify email matches session user
    if (email.trim().toLowerCase() !== session.user.email?.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match your account' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/api/user/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to delete account' },
        { status: response.status }
      );
    }

    // Account deleted successfully - return success
    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Delete account error:', error);
    
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
