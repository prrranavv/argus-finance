import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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

export async function POST(request: NextRequest) {
  try {
    const { oauth_token, oauth_token_secret, oauth_verifier } = await request.json()

    const consumerKey = process.env.SPLITWISE_CONSUMER_KEY
    const consumerSecret = process.env.SPLITWISE_CONSUMER_SECRET

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Splitwise OAuth credentials not configured' },
        { status: 500 }
      )
    }

    if (!oauth_token || !oauth_token_secret || !oauth_verifier) {
      return NextResponse.json(
        { error: 'Missing required OAuth parameters' },
        { status: 400 }
      )
    }

    // OAuth parameters
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
      oauth_version: '1.0'
    }

    // Generate signature
    const accessTokenUrl = 'https://secure.splitwise.com/api/v3.0/get_access_token'
    const signature = generateSignature('POST', accessTokenUrl, oauthParams, consumerSecret, oauth_token_secret)
    
    // Add signature to params
    const finalParams = {
      ...oauthParams,
      oauth_signature: signature
    }

    // Create authorization header
    const authHeader = 'OAuth ' + Object.entries(finalParams)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ')

    // Make request to Splitwise
    const response = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Splitwise access token error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get access token from Splitwise' },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    
    // Parse response (format: oauth_token=...&oauth_token_secret=...)
    const params = new URLSearchParams(responseText)
    const accessToken = params.get('oauth_token')
    const accessTokenSecret = params.get('oauth_token_secret')

    if (!accessToken || !accessTokenSecret) {
      console.error('Invalid access token response from Splitwise:', responseText)
      return NextResponse.json(
        { error: 'Invalid response from Splitwise' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      oauth_token: accessToken,
      oauth_token_secret: accessTokenSecret
    })

  } catch (error) {
    console.error('Splitwise access token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 