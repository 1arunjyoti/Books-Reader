import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    console.log('Session exists:', !!session);
    console.log('Session keys:', session ? Object.keys(session) : 'No session');
    console.log('Has accessToken:', !!session?.accessToken);
    console.log('Has tokenSet:', !!session?.tokenSet);
    console.log('TokenSet keys:', session?.tokenSet ? Object.keys(session.tokenSet) : 'No tokenSet');
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Check if access token is in the tokenSet
    const accessToken = session.accessToken || session.tokenSet?.accessToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'No access token available. Please sign out and sign in again.',
          hint: 'Your session was created before API authentication was configured.'
        },
        { status: 401 }
      );
    }

    // Calculate expiresIn from expires_at timestamp
    // expires_at is a Unix timestamp in seconds
    let expiresIn = 3600; // Default to 1 hour
    
    if (session.tokenSet && typeof session.tokenSet === 'object') {
      const tokenSetObj = session.tokenSet as unknown as Record<string, unknown>;
      if (tokenSetObj.expires_at && typeof tokenSetObj.expires_at === 'number') {
        const now = Math.floor(Date.now() / 1000);
        expiresIn = Math.max(0, tokenSetObj.expires_at - now);
      }
    }

    return NextResponse.json({ accessToken, expiresIn });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}
