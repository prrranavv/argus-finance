import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL + '/auth/gmail/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Gmail OAuth credentials not configured' },
        { status: 500 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Gmail token exchange error:', errorText);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for tokens' },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    // Validate that we got the required tokens
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return NextResponse.json(
        { error: 'Invalid token response from Google' },
        { status: 500 }
      );
    }

    // Get user info to verify the token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify Gmail token' },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      user_info: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    });

  } catch (error) {
    console.error('Gmail token exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange tokens' },
      { status: 500 }
    );
  }
} 