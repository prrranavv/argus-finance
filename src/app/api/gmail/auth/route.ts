import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Build the callback page URL with the parameters
    const callbackUrl = new URL('/auth/gmail/callback', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    if (error) {
      callbackUrl.searchParams.set('error', error);
    }
    
    if (code) {
      callbackUrl.searchParams.set('code', code);
    }
    
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    // Redirect to the callback page which will handle the OAuth flow
    return NextResponse.redirect(callbackUrl.toString());

  } catch (error) {
    console.error('Gmail OAuth callback API error:', error);
    
    // Redirect to callback page with error
    const callbackUrl = new URL('/auth/gmail/callback', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    callbackUrl.searchParams.set('error', 'callback_error');
    
    return NextResponse.redirect(callbackUrl.toString());
  }
} 