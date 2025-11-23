import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { API_ENDPOINTS } from '@/lib/config';

const API_BASE_URL = API_ENDPOINTS.BASE;

/**
 * POST /api/user/change-email
 * Request email change for the authenticated user
 * 
 * Security:
 * - Requires valid Clerk session with JWT token
 * - Password verification required (verified by backend)
 * - Email verification will be sent by Clerk
 * 
 * This will:
 * - Verify current password with Clerk
 * - Add new email to Clerk user (requires verification)
 * - Once verified, update primary email
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
    const { newEmail, password } = body;

    // Validate required fields
    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'New email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/api/user/change-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ newEmail, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to change email' },
        { status: response.status }
      );
    }

    // Email change requested successfully
    return NextResponse.json(
      { 
        message: data.message || 'Email change requested. Please verify your new email.',
        emailId: data.emailId 
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Change email error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
