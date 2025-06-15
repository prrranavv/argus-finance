import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthenticatedRequest extends NextRequest {
  userId: string
}

export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Error verifying user token:', error)
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error in getUserFromRequest:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<{ userId: string } | Response> {
  const userId = await getUserFromRequest(request)
  
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return { userId }
}

// Alternative method using cookies (for browser requests)
export async function getUserFromCookies(request: NextRequest): Promise<string | null> {
  try {
    // Get session from cookies
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Extract cookies and create session
    const cookies = request.cookies
    const accessToken = cookies.get('sb-access-token')?.value
    const refreshToken = cookies.get('sb-refresh-token')?.value

    if (!accessToken) {
      return null
    }

    // Set the session
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken)
    
    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error getting user from cookies:', error)
    return null
  }
} 