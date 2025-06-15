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
    const { access_token, access_token_secret } = await request.json()

    const consumerKey = process.env.SPLITWISE_CONSUMER_KEY
    const consumerSecret = process.env.SPLITWISE_CONSUMER_SECRET

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Splitwise OAuth credentials not configured' },
        { status: 500 }
      )
    }

    if (!access_token || !access_token_secret) {
      return NextResponse.json(
        { error: 'Missing access token credentials' },
        { status: 400 }
      )
    }

    // OAuth parameters for test API call
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: access_token,
      oauth_version: '1.0'
    }

    // Generate signature for test endpoint
    const testUrl = 'https://secure.splitwise.com/api/v3.0/test'
    const signature = generateSignature('GET', testUrl, oauthParams, consumerSecret, access_token_secret)
    
    // Add signature to params
    const finalParams = {
      ...oauthParams,
      oauth_signature: signature
    }

    // Create authorization header
    const authHeader = 'OAuth ' + Object.entries(finalParams)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ')

    // Make test request to Splitwise
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Splitwise test API error:', errorText)
      return NextResponse.json(
        { error: 'Splitwise API test failed', details: errorText },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Splitwise connection test successful',
      data: responseData
    })

  } catch (error) {
    console.error('Splitwise test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 