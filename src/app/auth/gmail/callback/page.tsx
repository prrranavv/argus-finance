'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function GmailCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error('Missing authorization code')
        }

        // Get stored state from session storage for CSRF protection
        const storedState = sessionStorage.getItem('gmail_oauth_state')
        if (state !== storedState) {
          throw new Error('Invalid state parameter - possible CSRF attack')
        }

        // Exchange authorization code for tokens
        const tokenResponse = await fetch('/api/gmail/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            state: state
          })
        })

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json()
          throw new Error(error.error || 'Failed to exchange authorization code')
        }

        const tokenData = await tokenResponse.json()

        // Calculate token expiration time
        const expiresAt = tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null

        // Save the integration to our database
        const saveResponse = await fetch('/api/onboarding/integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            integration_type: 'gmail',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            additional_data: {
              scope: tokenData.scope,
              token_type: tokenData.token_type,
              user_info: tokenData.user_info
            }
          })
        })

        if (!saveResponse.ok) {
          const error = await saveResponse.json()
          throw new Error(error.message || 'Failed to save Gmail integration')
        }

        // Clean up session storage
        sessionStorage.removeItem('gmail_oauth_state')

        setStatus('success')
        setMessage('Gmail connected successfully!')
        setUserInfo(tokenData.user_info)
        toast.success('Gmail connected! 📧')

        // Redirect back to onboarding after a short delay
        setTimeout(() => {
          router.push('/')
        }, 3000)

      } catch (error) {
        console.error('Gmail OAuth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to connect Gmail')
        toast.error('Failed to connect Gmail')
      }
    }

    if (user) {
      handleCallback()
    }
  }, [user, searchParams, router])

  const handleRetry = () => {
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Authenticating...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span>Gmail Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                <div>
                  <h3 className="font-semibold">Connecting to Gmail</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we set up your integration...
                  </p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-600">Success!</h3>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  {userInfo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">{userInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Redirecting you back to the app...
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 mx-auto text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-600">Connection Failed</h3>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
                <Button onClick={handleRetry} className="w-full">
                  Return to App
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 