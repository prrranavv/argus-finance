import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Encryption key - in production, this should be from environment
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('TOKEN_ENCRYPTION_KEY is not set – cannot encrypt/decrypt tokens');
}

interface UserIntegration {
  id: string
  user_id: string
  integration_type: 'gmail' | 'splitwise'
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  access_token_secret_encrypted: string | null
  token_expires_at: string | null
  additional_data: any
  is_active: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

interface DecryptedTokens {
  access_token: string | null
  refresh_token: string | null
  access_token_secret: string | null
  expires_at: Date | null
  additional_data: any
}

// Encryption/Decryption utilities
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  
  // Check if this is a new format (with IV) or old format (without IV)
  const textParts = encryptedText.split(':')
  
  if (textParts.length === 2) {
    // New format: IV:encryptedData
    try {
      const iv = Buffer.from(textParts[0], 'hex')
      const encryptedData = textParts[1]
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv)
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.log('Failed to decrypt with new format, trying old format...')
      // Fall through to old format
    }
  }
  
  // Old format: encrypted data without IV (legacy encryption used a default IV of zeros)
  try {
    const iv = Buffer.alloc(16, 0) // 16-byte zero IV matches legacy createCipher behaviour
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt with both old and new formats:', error)
    throw new Error('Failed to decrypt token - invalid format')
  }
}

// Get user integration tokens
export async function getUserTokens(
  userId: string, 
  integrationType: 'gmail' | 'splitwise'
): Promise<DecryptedTokens | null> {
  try {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log(`No ${integrationType} integration found for user ${userId}`)
      return null
    }

    const integration = data as UserIntegration

    return {
      access_token: integration.access_token_encrypted ? decrypt(integration.access_token_encrypted) : null,
      refresh_token: integration.refresh_token_encrypted ? decrypt(integration.refresh_token_encrypted) : null,
      access_token_secret: integration.access_token_secret_encrypted ? decrypt(integration.access_token_secret_encrypted) : null,
      expires_at: integration.token_expires_at ? new Date(integration.token_expires_at) : null,
      additional_data: integration.additional_data || {}
    }
  } catch (error) {
    console.error(`Error fetching ${integrationType} tokens for user ${userId}:`, error)
    return null
  }
}

// Check if token is expired
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  return new Date() >= expiresAt
}

// Refresh Gmail token
export async function refreshGmailToken(userId: string): Promise<DecryptedTokens | null> {
  try {
    const tokens = await getUserTokens(userId, 'gmail')
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Gmail token')
    }

    const data = await response.json()
    
    // Update database with new token
    const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000))
    
    await supabase
      .from('user_integrations')
      .update({
        access_token_encrypted: encrypt(data.access_token),
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')

    return {
      access_token: data.access_token,
      refresh_token: tokens.refresh_token,
      access_token_secret: null,
      expires_at: newExpiresAt,
      additional_data: tokens.additional_data
    }
  } catch (error) {
    console.error('Error refreshing Gmail token:', error)
    return null
  }
}

// Get valid Gmail token (refresh if needed)
export async function getValidGmailToken(userId: string): Promise<string | null> {
  try {
    let tokens = await getUserTokens(userId, 'gmail')
    if (!tokens || !tokens.access_token) {
      return null
    }

    // Check if token is expired and refresh if needed
    if (tokens.expires_at && isTokenExpired(tokens.expires_at)) {
      console.log('Gmail token expired, refreshing...')
      tokens = await refreshGmailToken(userId)
      if (!tokens || !tokens.access_token) {
        return null
      }
    }

    return tokens.access_token
  } catch (error) {
    console.error('Error getting valid Gmail token:', error)
    return null
  }
}

// Get Splitwise tokens (OAuth 1.0a doesn't expire)
export async function getSplitwiseTokens(userId: string): Promise<{
  access_token: string
  access_token_secret: string
} | null> {
  try {
    const tokens = await getUserTokens(userId, 'splitwise')
    if (!tokens || !tokens.access_token || !tokens.access_token_secret) {
      return null
    }

    return {
      access_token: tokens.access_token,
      access_token_secret: tokens.access_token_secret
    }
  } catch (error) {
    console.error('Error getting Splitwise tokens:', error)
    return null
  }
}

// Update user integration sync timestamp
export async function updateLastSync(userId: string, integrationType: 'gmail' | 'splitwise'): Promise<void> {
  try {
    await supabase
      .from('user_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
  } catch (error) {
    console.error(`Error updating last sync for ${integrationType}:`, error)
  }
}

// Deactivate integration (soft delete)
export async function deactivateIntegration(userId: string, integrationType: 'gmail' | 'splitwise'): Promise<void> {
  try {
    await supabase
      .from('user_integrations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
  } catch (error) {
    console.error(`Error deactivating ${integrationType} integration:`, error)
  }
} 