import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    
    console.log('[Token Route] userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Get access token from Clerk without template (uses default)
    // This generates a JWT that can be verified by the backend
    const accessToken = await getToken();
    
    console.log('[Token Route] accessToken retrieved:', !!accessToken);
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'No access token available. Please sign out and sign in again.',
          hint: 'Unable to retrieve authentication token.'
        },
        { status: 401 }
      );
    }

    // Default expiry to 1 hour (Clerk tokens typically expire in 1 hour)
    // Update: Clerk tokens actually expire in 60 seconds by default.
    // We now rely on the client to decode the token and determine expiration.
    // Attempt to get expiration from session claims if available
    let expiresIn: number | undefined;
    
    try {
      // sessionClaims might not be typed in all versions but seems fine here
      const { sessionClaims } = await auth();
      if (sessionClaims?.exp) {
        expiresIn = sessionClaims.exp - Math.floor(Date.now() / 1000);
      }
    } catch {
      // Ignore error accessing claims
    }

    return NextResponse.json({ accessToken, expiresIn });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
