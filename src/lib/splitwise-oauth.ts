/**
 * Splitwise OAuth Integration
 * Based on: https://blog.splitwise.com/2013/07/15/setting-up-oauth-for-the-splitwise-api/
 */

export interface SplitwiseOAuthConfig {
  consumerKey: string
  consumerSecret: string
  callbackUrl: string
}

export interface SplitwiseTokens {
  requestToken: string
  requestTokenSecret: string
  accessToken?: string
  accessTokenSecret?: string
}

export class SplitwiseOAuth {
  private config: SplitwiseOAuthConfig
  private baseUrl = 'https://secure.splitwise.com'

  constructor(config: SplitwiseOAuthConfig) {
    this.config = config
  }

  /**
   * Step 1: Get request token and redirect URL
   */
  async getRequestToken(): Promise<{ token: string; secret: string; authUrl: string }> {
    const response = await fetch('/api/splitwise/request-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_url: this.config.callbackUrl
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get request token')
    }

    const data = await response.json()
    
    return {
      token: data.oauth_token,
      secret: data.oauth_token_secret,
      authUrl: `${this.baseUrl}/authorize?oauth_token=${data.oauth_token}`
    }
  }

  /**
   * Step 2: Exchange request token for access token
   */
  async getAccessToken(
    requestToken: string, 
    requestTokenSecret: string, 
    verifier: string
  ): Promise<{ token: string; secret: string }> {
    const response = await fetch('/api/splitwise/access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oauth_token: requestToken,
        oauth_token_secret: requestTokenSecret,
        oauth_verifier: verifier
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get access token')
    }

    const data = await response.json()
    
    return {
      token: data.oauth_token,
      secret: data.oauth_token_secret
    }
  }

  /**
   * Test the connection with a simple API call
   */
  async testConnection(accessToken: string, accessTokenSecret: string): Promise<boolean> {
    try {
      const response = await fetch('/api/splitwise/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          access_token_secret: accessTokenSecret
        })
      })

      return response.ok
    } catch (error) {
      console.error('Splitwise connection test failed:', error)
      return false
    }
  }
}

/**
 * Initialize Splitwise OAuth with client-side environment variables
 */
export function createSplitwiseOAuth(): SplitwiseOAuth {
  const config: SplitwiseOAuthConfig = {
    consumerKey: process.env.SPLITWISE_CONSUMER_KEY || '',
    consumerSecret: '', // Not needed on client side
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/splitwise/callback`
  }

  if (!config.consumerKey) {
    throw new Error('Splitwise OAuth credentials not configured')
  }

  return new SplitwiseOAuth(config)
}

/**
 * Client-side helper to initiate OAuth flow
 */
export async function initiateSplitwiseOAuth(): Promise<void> {
  try {
    // Check if OAuth is configured by making a test request to the API
    const testResponse = await fetch('/api/splitwise/request-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/splitwise/callback`
      })
    })

    if (!testResponse.ok) {
      const error = await testResponse.json()
      throw new Error(error.error || 'OAuth setup required')
    }

    const data = await testResponse.json()
    
    // Store request token in session storage for callback
    sessionStorage.setItem('splitwise_request_token', data.oauth_token)
    sessionStorage.setItem('splitwise_request_token_secret', data.oauth_token_secret)
    
    // Redirect to Splitwise authorization page
    const authUrl = `https://secure.splitwise.com/authorize?oauth_token=${data.oauth_token}`
    window.location.href = authUrl
  } catch (error) {
    console.error('Failed to initiate Splitwise OAuth:', error)
    throw error
  }
} 