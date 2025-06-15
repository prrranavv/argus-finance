'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function SplitwiseCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const oauthToken = searchParams.get('oauth_token')
        const oauthVerifier = searchParams.get('oauth_verifier')

        if (!oauthToken || !oauthVerifier) {
          throw new Error('Missing OAuth parameters')
        }

        // Get stored request token secret from session storage
        const requestTokenSecret = sessionStorage.getItem('splitwise_request_token_secret')
        if (!requestTokenSecret) {
          throw new Error('Missing request token secret')
        }

        // Exchange request token for access token
        const accessTokenResponse = await fetch('/api/splitwise/access-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oauth_token: oauthToken,
            oauth_token_secret: requestTokenSecret,
            oauth_verifier: oauthVerifier
          })
        })

        if (!accessTokenResponse.ok) {
          const error = await accessTokenResponse.json()
          throw new Error(error.error || 'Failed to get access token')
        }

        const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret } = await accessTokenResponse.json()

        // Test the connection
        const testResponse = await fetch('/api/splitwise/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
            access_token_secret: accessTokenSecret
          })
        })

        if (!testResponse.ok) {
          throw new Error('Failed to verify Splitwise connection')
        }

        // Save the integration to our database
        const saveResponse = await fetch('/api/onboarding/integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            integration_type: 'splitwise',
            access_token: accessToken,
            access_token_secret: accessTokenSecret
          })
        })

        if (!saveResponse.ok) {
          const error = await saveResponse.json()
          throw new Error(error.message || 'Failed to save integration')
        }

        // Clean up session storage
        sessionStorage.removeItem('splitwise_request_token')
        sessionStorage.removeItem('splitwise_request_token_secret')

        setStatus('success')
        setMessage('Splitwise connected successfully!')
        toast.success('Splitwise connected! 🤝')

        // Redirect back to onboarding after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)

      } catch (error) {
        console.error('Splitwise OAuth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to connect Splitwise')
        toast.error('Failed to connect Splitwise')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span>Splitwise Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
                <div>
                  <h3 className="font-semibold">Connecting to Splitwise</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we set up your integration...
                  </p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-600">Success!</h3>
                  <p className="text-sm text-muted-foreground">{message}</p>
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