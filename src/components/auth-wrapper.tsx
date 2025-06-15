'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOnboarding } from '@/hooks/use-onboarding';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { OnboardingModal } from '@/components/onboarding-modal';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Function to clear all auth-related storage
const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }
};

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const { onboarding, loading: onboardingLoading } = useOnboarding();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && onboarding && !onboardingLoading) {
      // Show onboarding if user hasn't completed it and hasn't skipped it
      const needsOnboarding = !onboarding.is_completed && !onboardingSkipped;
      setShowOnboarding(needsOnboarding);
    }
  }, [user, onboarding, onboardingLoading, onboardingSkipped]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingSkipped(false); // Reset skip state since they completed it
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setOnboardingSkipped(true); // Remember that user skipped onboarding
  };

  // Show loading state
  if (authLoading || (user && onboardingLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth forms if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md p-6">
          {authMode === 'signin' ? (
            <SignInForm onSwitchToSignUp={() => setAuthMode('signup')} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setAuthMode('signin')} />
          )}
        </div>
      </div>
    );
  }

  // Show main app with optional onboarding modal
  return (
    <>
      {children}
      
      {/* Onboarding Modal - Non-mandatory */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
} 