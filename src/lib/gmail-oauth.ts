/**
 * Gmail OAuth 2.0 Integration
 * Based on: https://developers.google.com/identity/protocols/oauth2
 */

export interface GmailOAuthConfig {
  clientId: string
  redirectUri: string
}

export interface GmailTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType: string
  scope: string
}

/**
 * Initiate Gmail OAuth flow
 */
export async function initiateGmailOAuth(): Promise<void> {
  try {
    // Check if Gmail OAuth is configured
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error('Gmail OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.')
    }

    // Get OAuth URL from our API
    const response = await fetch('/api/gmail/request-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get Gmail OAuth URL')
    }

    const { authUrl, state } = await response.json()

    // Store state for CSRF protection
    sessionStorage.setItem('gmail_oauth_state', state)

    // Redirect to Google OAuth
    window.location.href = authUrl

  } catch (error) {
    console.error('Gmail OAuth initiation error:', error)
    throw error
  }
}

/**
 * Test Gmail OAuth configuration
 */
export async function testGmailOAuthConfig(): Promise<boolean> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    return !!clientId
  } catch (error) {
    console.error('Gmail OAuth config test error:', error)
    return false
  }
} 