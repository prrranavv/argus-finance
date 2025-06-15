import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL + '/auth/gmail/callback';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Gmail OAuth credentials not configured' },
        { status: 500 }
      );
    }

    // Gmail OAuth 2.0 scopes
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    // Generate state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    // Store state in session (you might want to use a more secure method)
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline'); // Important for refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.set('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    });

  } catch (error) {
    console.error('Gmail OAuth request error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Gmail OAuth URL' },
      { status: 500 }
    );
  }
} 