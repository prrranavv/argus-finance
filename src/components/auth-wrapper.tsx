'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    // Check if authentication is required
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authRequired) {
          // Auth not required, allow access
          setIsAuthenticated(true);
          setAuthRequired(false);
        } else {
          // Auth is required, always show login form (no session caching)
          setAuthRequired(true);
          setIsAuthenticated(false); // Always require fresh authentication
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Default to requiring auth if check fails
        setAuthRequired(true);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authRequired || isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-500 p-4">
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
          
          {/* Lock Icon */}
          <div className="mx-auto">
            <Image
              src="/cardImages/lockicon.png"
              alt="Lock Icon"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Password Label */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password to access dashboard"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-12 border-gray-300 text-gray-600 placeholder-gray-400"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
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
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            {/* Access Dashboard Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
            >
              Access Dashboard
            </Button>
          </form>
          
          {/* Bottom Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This is a protected financial dashboard. Please enter the correct password to continue.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 