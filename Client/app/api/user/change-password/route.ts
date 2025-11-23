import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { API_ENDPOINTS } from '@/lib/config';

const API_BASE_URL = API_ENDPOINTS.BASE;

/**
 * POST /api/user/change-password
 * Change password for the authenticated user
 * 
 * Security:
 * - Requires valid Clerk session with JWT token
 * - Current password verification required
 * - New password must meet strength requirements
 * 
 * This will:
 * - Verify current password with Clerk
 * - Update password in Clerk
 * - All sessions remain valid after password change
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

    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { getToken } = await auth();
    const accessToken = await getToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not available' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to change password' },
        { status: response.status }
      );
    }

    // Password changed successfully
    return NextResponse.json(
      { message: data.message || 'Password changed successfully' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Change password error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
