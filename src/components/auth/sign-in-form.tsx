'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"

interface SignInFormProps {
  onSwitchToSignUp: () => void
}

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-white shadow-2xl">
      <CardHeader className="text-center pb-0">
        {/* Argus Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <Image
              src="/cardImages/argusLogo.png"
              alt="Argus Logo"
              width={48}
              height={48}
              className="object-contain"
            />
            <h1 className="text-3xl font-bold text-black">Argus</h1>
          </div>
        </div>
        
        <CardTitle className="text-2xl font-bold text-black">Welcome Back</CardTitle>
        <CardDescription className="text-gray-600">
          Sign in to your financial dashboard
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Email</label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-300 text-gray-600 placeholder-gray-400"
              required
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 h-12 border-gray-300 text-gray-600 placeholder-gray-400"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        
        {/* Switch to Sign Up */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-medium text-black hover:underline"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 