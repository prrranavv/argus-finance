'use client';

import { useAuth } from '@/contexts/auth-context';
import { AuthModal } from '@/components/auth-modal';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, authenticate } = useAuth();

  const handleAuthenticate = (password: string) => {
    authenticate(password);
  };

  if (!isAuthenticated) {
    return <AuthModal isOpen={true} onAuthenticate={handleAuthenticate} />;
  }

  return <>{children}</>;
} 