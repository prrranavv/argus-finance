import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // Return a very basic auth URL
    const params = {
      response_type: 'code',
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: 'http://localhost:3000/api/gmail/simple',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      access_type: 'offline',
      prompt: 'consent'
    };

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return NextResponse.json({
      message: 'Simple Gmail OAuth Test',
      steps: [
        '1. Add this to Google Cloud Console redirect URIs: http://localhost:3000/api/gmail/simple',
        '2. Wait 5-10 minutes for changes to propagate',
        '3. Use the auth URL below'
      ],
      auth_url: `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`,
      alternative_suggestion: 'If OAuth continues to be problematic, we can implement a manual email paste feature instead'
    });
  }

  // If we have a code, just show success for now
  return NextResponse.json({
    success: true,
    message: 'OAuth code received! Gmail integration would work.',
    code_received: code?.substring(0, 30) + '...',
    next_steps: [
      'Add the full token exchange logic',
      'Test Gmail API calls',
      'Integrate with your finance app'
    ],
    recommendation: 'Since OAuth is working, we can now complete the Gmail integration'
  });
} 