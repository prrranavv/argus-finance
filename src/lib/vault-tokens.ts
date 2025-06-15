import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserIntegration {
  id: string
  user_id: string
  integration_type: 'gmail' | 'splitwise'
  access_token_vault_id: string | null
  refresh_token_vault_id: string | null
  access_token_secret_vault_id: string | null
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

// Get token from Supabase Vault using the wrapper function
async function getTokenFromVault(vaultId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_vault_secret', {
      secret_id: vaultId
    })

    if (error) {
      console.error('Error fetching token from vault:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error accessing vault:', error)
    return null
  }
}

// Store token in Supabase Vault using the wrapper function
async function storeTokenInVault(
  token: string, 
  name?: string, 
  description?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('create_vault_secret', {
      secret_value: token,
      secret_name: name || null,
      secret_description: description || null
    })

    if (error) {
      console.error('Error storing token in vault:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error storing token in vault:', error)
    return null
  }
}

// Update token in Supabase Vault using the wrapper function
async function updateTokenInVault(
  vaultId: string,
  newToken: string,
  name?: string,
  description?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_vault_secret', {
      secret_id: vaultId,
      new_secret_value: newToken,
      new_secret_name: name || null,
      new_secret_description: description || null
    })

    if (error) {
      console.error('Error updating token in vault:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating token in vault:', error)
    return false
  }
}

// Get user integration from database
async function getUserIntegration(userId: string, integrationType: 'gmail' | 'splitwise'): Promise<UserIntegration | null> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('integration_type', integrationType)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching user integration:', error)
    return null
  }

  return data
}

// Get all tokens for a user integration
export async function getUserTokens(userId: string, integrationType: 'gmail' | 'splitwise'): Promise<DecryptedTokens | null> {
  try {
    const integration = await getUserIntegration(userId, integrationType)
    if (!integration) {
      return null
    }

    const tokens: DecryptedTokens = {
      access_token: null,
      refresh_token: null,
      access_token_secret: null,
      expires_at: integration.token_expires_at ? new Date(integration.token_expires_at) : null,
      additional_data: integration.additional_data
    }

    // Get access token from vault
    if (integration.access_token_vault_id) {
      tokens.access_token = await getTokenFromVault(integration.access_token_vault_id)
    }

    // Get refresh token from vault
    if (integration.refresh_token_vault_id) {
      tokens.refresh_token = await getTokenFromVault(integration.refresh_token_vault_id)
    }

    // Get access token secret from vault (for OAuth 1.0a like Splitwise)
    if (integration.access_token_secret_vault_id) {
      tokens.access_token_secret = await getTokenFromVault(integration.access_token_secret_vault_id)
    }

    return tokens
  } catch (error) {
    console.error('Error getting user tokens:', error)
    return null
  }
}

// Get valid Gmail token (with automatic refresh)
export async function getValidGmailToken(userId: string): Promise<string | null> {
  try {
    const tokens = await getUserTokens(userId, 'gmail')
    if (!tokens || !tokens.access_token) {
      return null
    }

    // Check if token is expired
    if (tokens.expires_at && tokens.expires_at <= new Date()) {
      console.log('Gmail token expired, attempting refresh...')
      
      if (!tokens.refresh_token) {
        console.error('No refresh token available')
        return null
      }

      // Refresh the token
      const refreshed = await refreshGmailToken(userId, tokens.refresh_token)
      return refreshed
    }

    return tokens.access_token
  } catch (error) {
    console.error('Error getting valid Gmail token:', error)
    return null
  }
}

// Refresh Gmail token
export async function refreshGmailToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh Gmail token:', response.statusText)
      return null
    }

    const data = await response.json()
    
    // Update the access token in vault
    const integration = await getUserIntegration(userId, 'gmail')
    if (!integration || !integration.access_token_vault_id) {
      console.error('No integration or vault ID found for token update')
      return null
    }

    const updated = await updateTokenInVault(
      integration.access_token_vault_id,
      data.access_token,
      'gmail_access_token',
      `Gmail access token for user ${userId}`
    )

    if (!updated) {
      console.error('Failed to update access token in vault')
      return null
    }

    // Update expiration time in database
    const expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    await supabase
      .from('user_integrations')
      .update({ 
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id)

    return data.access_token
  } catch (error) {
    console.error('Error refreshing Gmail token:', error)
    return null
  }
}

// Get Splitwise tokens (OAuth 1.0a)
export async function getSplitwiseTokens(userId: string): Promise<{ access_token: string; access_token_secret: string } | null> {
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

// Store integration tokens in vault
export async function storeIntegrationTokens(
  userId: string,
  integrationType: 'gmail' | 'splitwise',
  tokens: {
    access_token: string
    refresh_token?: string
    access_token_secret?: string
    expires_in?: number
    additional_data?: any
  }
): Promise<boolean> {
  try {
    // Store tokens in vault
    const accessTokenVaultId = await storeTokenInVault(
      tokens.access_token,
      `${integrationType}_access_token`,
      `${integrationType} access token for user ${userId}`
    )

    if (!accessTokenVaultId) {
      console.error('Failed to store access token in vault')
      return false
    }

    let refreshTokenVaultId: string | null = null
    if (tokens.refresh_token) {
      refreshTokenVaultId = await storeTokenInVault(
        tokens.refresh_token,
        `${integrationType}_refresh_token`,
        `${integrationType} refresh token for user ${userId}`
      )

      if (!refreshTokenVaultId) {
        console.error('Failed to store refresh token in vault')
        return false
      }
    }

    let accessTokenSecretVaultId: string | null = null
    if (tokens.access_token_secret) {
      accessTokenSecretVaultId = await storeTokenInVault(
        tokens.access_token_secret,
        `${integrationType}_access_token_secret`,
        `${integrationType} access token secret for user ${userId}`
      )

      if (!accessTokenSecretVaultId) {
        console.error('Failed to store access token secret in vault')
        return false
      }
    }

    // Calculate expiration time
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + (tokens.expires_in * 1000))
      : null

    // Store integration record in database
    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        integration_type: integrationType,
        access_token_vault_id: accessTokenVaultId,
        refresh_token_vault_id: refreshTokenVaultId,
        access_token_secret_vault_id: accessTokenSecretVaultId,
        token_expires_at: expiresAt?.toISOString() || null,
        additional_data: tokens.additional_data || {},
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,integration_type'
      })

    if (error) {
      console.error('Error storing integration in database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error storing integration tokens:', error)
    return false
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
    // Get integration to find vault IDs
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
      .single()

    if (integration) {
      // Note: We don't delete from vault here as there's no direct delete function
      // The vault entries will remain but won't be accessible via the integration
    }

    // Deactivate integration
    await supabase
      .from('user_integrations')
      .update({
        is_active: false,
        access_token_vault_id: null,
        refresh_token_vault_id: null,
        access_token_secret_vault_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
  } catch (error) {
    console.error(`Error deactivating ${integrationType} integration:`, error)
  }
} 