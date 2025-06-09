import { NextRequest, NextResponse } from 'next/server';

const getRedirectUri = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://argus-finance.vercel.app/api/gmail/test'
    : 'http://localhost:3000/api/gmail/test';
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Return minimal OAuth URL for manual testing
  if (!code) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: getRedirectUri(),
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      test_info: {
        client_id: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        redirect_uri: getRedirectUri(),
        manual_auth_url: authUrl
      },
      instructions: [
        '1. Add http://localhost:3000/api/gmail/test to your OAuth client redirect URIs in Google Cloud Console',
        '2. Use the manual_auth_url above to authorize',
        '3. This will help us isolate the OAuth issue'
      ]
    });
  }

  // Manual token exchange with raw fetch to bypass googleapis library
  try {
    console.log('🧪 [TEST] Manual token exchange attempt');
    console.log('🧪 [TEST] Code:', code?.substring(0, 30) + '...');
    console.log('🧪 [TEST] Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });

    const responseText = await tokenResponse.text();
    console.log('🧪 [TEST] Raw Google response:', responseText);

    if (!tokenResponse.ok) {
      const errorData = JSON.parse(responseText);
      return NextResponse.json({
        error: 'Manual token exchange failed',
        status: tokenResponse.status,
        google_error: errorData,
        debug_info: {
          client_id_prefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
          redirect_uri: getRedirectUri(),
          code_prefix: code?.substring(0, 30) + '...'
        },
        troubleshooting: [
          'This error came directly from Google OAuth servers',
          'Check that the OAuth client is configured as Web application',
          'Verify redirect URI is exactly: http://localhost:3000/api/gmail/test',
          'Ensure OAuth consent screen is properly configured'
        ]
      }, { status: 500 });
    }

    const tokens = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      message: 'Manual token exchange SUCCESS!',
      tokens: {
        access_token: tokens.access_token?.substring(0, 20) + '...',
        refresh_token: tokens.refresh_token?.substring(0, 20) + '...',
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      },
      env_vars_to_add: {
        GMAIL_ACCESS_TOKEN: tokens.access_token,
        GMAIL_REFRESH_TOKEN: tokens.refresh_token
      }
    });

  } catch (error) {
    console.error('🧪 [TEST] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error during manual token exchange',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 