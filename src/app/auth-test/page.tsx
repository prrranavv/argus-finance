'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

export default function AuthTestPage() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">🔐 Auth Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? '✅ True' : '❌ False'}</p>
              <p><strong>User:</strong> {user ? '✅ Authenticated' : '❌ Not authenticated'}</p>
              <p><strong>Profile:</strong> {profile ? '✅ Loaded' : '❌ Not loaded'}</p>
            </div>
          </div>

          {user && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">User Details</h2>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {profile && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
              <div className="space-y-2">
                <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Privacy Mode:</strong> {profile.preferences?.privacy_mode ? '✅ On' : '❌ Off'}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              ← Back to Dashboard
            </Button>
            
            {user && (
              <Button 
                onClick={signOut}
                variant="destructive"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p>This page helps debug authentication issues. If you can see your user details above, auth is working correctly.</p>
        </div>
      </div>
    </div>
  )
} 