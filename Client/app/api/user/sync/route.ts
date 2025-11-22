import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { API_ENDPOINTS } from '@/lib/config';

const API_BASE_URL = API_ENDPOINTS.BASE;

/**
 * POST /api/user/sync
 * Sync user profile from Clerk to database
 * 
 * Security:
 * - JWT authentication required
 */
export async function POST() {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const accessToken = await getToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/api/user/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to sync profile' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: unknown) {
    console.error('Sync profile error:', error);
    
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
