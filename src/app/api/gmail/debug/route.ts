import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Debug OAuth configuration - use debug endpoint as redirect
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/gmail/debug' // Use debug endpoint as redirect
  );

  const debugInfo = {
    environment_check: {
      client_id_set: !!process.env.GOOGLE_CLIENT_ID,
      client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri_set: !!process.env.GOOGLE_REDIRECT_URI,
      original_redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      debug_redirect_uri: 'http://localhost:3000/api/gmail/debug',
      client_id_prefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...'
    },
    request_info: {
      has_code: !!code,
      code_prefix: code?.substring(0, 20) + '...',
      full_url: request.url,
      user_agent: request.headers.get('user-agent'),
      all_params: Object.fromEntries(searchParams.entries())
    },
    oauth_config: {
      expected_redirect_uri: 'http://localhost:3000/api/gmail/debug',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    },
    timestamp: new Date().toISOString()
  };

  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent',
      state: 'debug_mode_v2' // Updated state
    });

    return NextResponse.json({
      debug_info: debugInfo,
      auth_url: authUrl,
      message: 'Use this debug URL for OAuth flow - redirects to /api/gmail/debug',
      instructions: 'IMPORTANT: You need to add http://localhost:3000/api/gmail/debug to your Google Cloud Console redirect URIs'
    });
  }

  // Try to exchange code for tokens with detailed error handling
  try {
    console.log('🔍 [DEBUG] Attempting token exchange...');
    console.log('🔍 [DEBUG] Code received:', code?.substring(0, 30) + '...');
    console.log('🔍 [DEBUG] Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('🔍 [DEBUG] Using redirect URI:', 'http://localhost:3000/api/gmail/debug');
    console.log('🔍 [DEBUG] Current time:', new Date().toISOString());

    const { tokens } = await oauth2Client.getToken(code);
    
    return NextResponse.json({
      success: true,
      debug_info: debugInfo,
      tokens: {
        access_token: tokens.access_token?.substring(0, 20) + '...',
        refresh_token: tokens.refresh_token?.substring(0, 20) + '...',
        expires_at: tokens.expiry_date,
        has_refresh_token: !!tokens.refresh_token
      },
      message: 'SUCCESS! Token exchange worked!',
      next_steps: [
        'Copy these tokens to your .env.local:',
        `GMAIL_ACCESS_TOKEN=${tokens.access_token}`,
        `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`
      ]
    });

  } catch (error: any) {
    console.error('🚨 [DEBUG] Token exchange failed:', error);
    
    return NextResponse.json({
      error: 'Token exchange failed in debug mode',
      debug_info: debugInfo,
      error_details: {
        message: error.message,
        code: error.code,
        status: error.status,
        response_data: error.response?.data,
        stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      },
      google_oauth_common_issues: {
        invalid_grant_causes: [
          "Authorization code already used (codes are single-use)",
          "Authorization code expired (10 minute timeout)",
          "Clock skew between client and Google servers", 
          "Redirect URI mismatch (case sensitive)",
          "Client ID/Secret mismatch",
          "OAuth consent screen not properly configured"
        ],
        next_debugging_steps: [
          "1. Add http://localhost:3000/api/gmail/debug to Google Cloud Console redirect URIs",
          "2. Try generating a fresh authorization URL",
          "3. Check system clock is synchronized",
          "4. Verify OAuth consent screen shows 'Testing' status"
        ]
      }
    }, { status: 500 });
  }
} 