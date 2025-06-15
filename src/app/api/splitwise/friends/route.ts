import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSplitwiseTokens } from '@/lib/vault-tokens';
import crypto from 'crypto';

// OAuth 1.0a signature generation
function generateSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&')

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`

  // Generate signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64')

  return signature
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    const { userId } = authResult;

    // Get user's Splitwise tokens from database
    const tokens = await getSplitwiseTokens(userId);
    if (!tokens || !tokens.access_token || !tokens.access_token_secret) {
      return NextResponse.json(
        { error: 'Splitwise authentication required. Please connect your Splitwise account.' },
        { status: 401 }
      );
    }

    const consumerKey = process.env.SPLITWISE_CONSUMER_KEY;
    const consumerSecret = process.env.SPLITWISE_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'Splitwise OAuth credentials not configured' }, { status: 500 });
    }

    // OAuth parameters
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: tokens.access_token,
      oauth_version: '1.0'
    };

    const url = 'https://secure.splitwise.com/api/v3.0/get_friends';
    
    // Generate signature
    const signature = generateSignature('GET', url, oauthParams, consumerSecret, tokens.access_token_secret!);
    
    // Add signature to params
    const finalParams = {
      ...oauthParams,
      oauth_signature: signature
    };

    // Create authorization header
    const authHeader = 'OAuth ' + Object.entries(finalParams)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch friends from Splitwise',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Splitwise friends:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch friends', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 