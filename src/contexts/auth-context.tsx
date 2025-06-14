'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClientClient } from '@/lib/supabase';
import { User } from '@/types/supabase';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
updateProfile: (updates: Partial<User>) => Promise<void>;
  inviteFriend: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Memoize the supabase client to prevent recreating it on every render
  const supabase = useMemo(() => createClientClient(), []);



  useEffect(() => {
    console.log('🔐 AuthProvider: Setting up auth state listener...');
    
    let mounted = true;
    
    // Add a failsafe timeout to prevent infinite loading
    const failsafeTimeout = setTimeout(() => {
      if (mounted) {
        console.log('🔐 AuthProvider: FAILSAFE - Setting loading to false after 3 seconds');
        setLoading(false);
      }
    }, 3000);
    
    // Set up auth state change listener following Supabase docs pattern
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔐 AuthProvider: Auth event:', event, 'User:', session?.user?.id);
        
        // Clear failsafe timeout since we got an auth event
        clearTimeout(failsafeTimeout);
        
        if (event === 'INITIAL_SESSION') {
          // Handle initial session - this is fired when the client is first created
          console.log('🔐 AuthProvider: Initial session loaded');
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            // Fetch profile without await to avoid blocking
            setTimeout(async () => {
              try {
                const { data, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', currentUser.id)
                  .single();

                if (mounted) {
                  if (error) {
                    console.error('🔐 AuthProvider: Error fetching profile:', error);
                    setProfile(null);
                  } else {
                    console.log('🔐 AuthProvider: Profile loaded:', data?.email);
                    setProfile(data);
                  }
                }
              } catch (error) {
                console.error('🔐 AuthProvider: Exception fetching profile:', error);
                if (mounted) setProfile(null);
              }
            }, 0);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          console.log('🔐 AuthProvider: User signed in');
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            setTimeout(async () => {
              try {
                const { data, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', currentUser.id)
                  .single();

                if (mounted) {
                  if (error) {
                    console.error('🔐 AuthProvider: Error fetching profile:', error);
                    setProfile(null);
                  } else {
                    console.log('🔐 AuthProvider: Profile loaded:', data?.email);
                    setProfile(data);
                  }
                }
              } catch (error) {
                console.error('🔐 AuthProvider: Exception fetching profile:', error);
                if (mounted) setProfile(null);
              }
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 AuthProvider: User signed out');
          setUser(null);
          setProfile(null);
          
          // Clear any stale auth cookies
          if (typeof window !== 'undefined') {
            // Clear Supabase auth cookies
            document.cookie.split(";").forEach((c) => {
              const eqPos = c.indexOf("=");
              const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
              if (name.includes('supabase') || name.includes('sb-')) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              }
            });
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔐 AuthProvider: Token refreshed');
          // User stays the same, just token refreshed
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🔐 AuthProvider: Cleaning up auth listener...');
      mounted = false;
      clearTimeout(failsafeTimeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // Refresh profile data
    try {
      const { data, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('🔐 AuthProvider: Error refreshing user profile:', profileError);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('🔐 AuthProvider: Exception refreshing user profile:', error);
    }
  };

  const inviteFriend = async (email: string) => {
    // For now, this is a placeholder - we'll implement proper invitations later
    console.log('Inviting friend:', email);
    // TODO: Implement email invitation logic
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        signIn, 
        signUp, 
        signOut, 
        updateProfile, 
        inviteFriend 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 