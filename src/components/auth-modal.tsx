'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (password: string) => void;
}

export function AuthModal({ isOpen, onAuthenticate }: AuthModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple validation
    if (!password.trim()) {
      setError('Please enter a password');
      setIsLoading(false);
      return;
    }

    try {
      // Call server-side authentication API
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onAuthenticate(password);
      } else {
        setError(data.error || 'Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Network error. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          {/* App Logo - Top Left Corner */}
          <div className="flex items-center gap-3 mb-6 -mt-2 -ml-2">
            <div className="relative w-12 h-12">
              <Image
                src="/cardImages/argusLogo.png"
                alt="Argus Logo"
                fill
                className="object-contain"
                quality={95}
              />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Argus
            </DialogTitle>
          </div>
          
          {/* Extra Large Lock Icon - Centered */}
          <div className="flex justify-center mb-1">
            <div className="relative w-40 h-40">
              <Image
                src="/cardImages/lockicon.png"
                alt="Security Lock"
                fill
                className="object-contain"
                quality={95}
              />
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password to access dashboard"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
              className="w-full"
            />
          </div>

          {error && (
            <div className="relative w-full rounded-lg border border-red-500/50 p-4 text-red-600 bg-red-50">
              <div className="text-sm">{error}</div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Access Dashboard'}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground text-center mt-6">
          This is a protected financial dashboard. Please enter the correct password to continue.
        </div>
      </DialogContent>
    </Dialog>
  );
} 