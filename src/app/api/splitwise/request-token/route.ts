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
    const { callback_url } = await request.json()

    const consumerKey = process.env.SPLITWISE_CONSUMER_KEY
    const consumerSecret = process.env.SPLITWISE_CONSUMER_SECRET

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Splitwise OAuth credentials not configured' },
        { status: 500 }
      )
    }

    // OAuth parameters
    const oauthParams = {
      oauth_callback: callback_url || 'oob',
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0'
    }

    // Generate signature
    const requestTokenUrl = 'https://secure.splitwise.com/api/v3.0/get_request_token'
    const signature = generateSignature('POST', requestTokenUrl, oauthParams, consumerSecret)
    
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
    const response = await fetch(requestTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Splitwise request token error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get request token from Splitwise' },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    
    // Parse response (format: oauth_token=...&oauth_token_secret=...&oauth_callback_confirmed=true)
    const params = new URLSearchParams(responseText)
    const oauthToken = params.get('oauth_token')
    const oauthTokenSecret = params.get('oauth_token_secret')
    const callbackConfirmed = params.get('oauth_callback_confirmed')

    if (!oauthToken || !oauthTokenSecret) {
      console.error('Invalid response from Splitwise:', responseText)
      return NextResponse.json(
        { error: 'Invalid response from Splitwise' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      oauth_token: oauthToken,
      oauth_token_secret: oauthTokenSecret,
      oauth_callback_confirmed: callbackConfirmed === 'true'
    })

  } catch (error) {
    console.error('Splitwise request token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 