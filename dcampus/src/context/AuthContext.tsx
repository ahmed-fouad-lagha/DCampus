import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, auth } from '../config/supabase';
import { Profile } from '../types/database.types';

// Remove loading completely - always skip auth check
const ALWAYS_SKIP_AUTH = true;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  connectionAttempts: number;
  retryConnection: () => void;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
  updateProfile: (data: Partial<Profile>) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 1; // Reduced from 2 to 1
// Time between retry attempts in milliseconds (1 second)
const RETRY_DELAY = 1000; // Reduced from 2000 to 1000
// Auth check timeout in milliseconds (reduced from 8s to 4s)
const AUTH_TIMEOUT = 4000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Set initial loading to false
  const [authError, setAuthError] = useState<Error | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  // Function to check Supabase connection and session - using useCallback to memoize
  const checkSessionAndConnection = useCallback(async (attemptNumber = 0) => {
    let isMounted = true;
    
    // Clear any existing timeout
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    
    // Set a timeout to prevent UI from being stuck if operations take too long
    const id = window.setTimeout(() => {
      if (isMounted) {
        console.warn(`Auth loading timed out after ${AUTH_TIMEOUT / 1000} seconds`);
        setLoading(false);
        setAuthError(new Error('Authentication check timed out. Please check your internet connection or verify that the Supabase project is active.'));
      }
    }, AUTH_TIMEOUT);
    
    setTimeoutId(id);
    setConnectionAttempts(attemptNumber);

    try {
      console.log(`Attempting to connect to Supabase (attempt ${attemptNumber + 1}/${MAX_RETRY_ATTEMPTS + 1})`);
      
      // First try a simple ping to check if Supabase is accessible
      try {
        const pingStart = Date.now();
        const { error: pingError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .limit(1);
          
        const pingTime = Date.now() - pingStart;
        
        if (pingError) {
          console.warn(`Supabase ping failed: ${pingError.message} (${pingTime}ms)`);
        } else {
          console.log(`Supabase ping successful (${pingTime}ms)`);
        }
      } catch (pingErr) {
        console.warn('Supabase ping exception:', pingErr);
      }
      
      // Now try to get the session
      const { data: { session }, error } = await auth.getSession();
      
      // Clear the timeout since we got a response (success or error)
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      if (error) {
        console.error('Session check error:', error);
        if (isMounted) {
          setAuthError(error);
        }
      }
      
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
      
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        
        // Success, reset connection attempts
        setConnectionAttempts(0);
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error during session check:', err);
      
      // Clear the timeout since we caught an error
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      if (isMounted) {
        setAuthError(err as Error);
        
        // If we haven't exceeded max retry attempts, try again after a delay
        if (attemptNumber < MAX_RETRY_ATTEMPTS) {
          console.log(`Will retry connection in ${RETRY_DELAY / 1000} seconds...`);
          setTimeout(() => {
            if (isMounted) {
              checkSessionAndConnection(attemptNumber + 1);
            }
          }, RETRY_DELAY);
        } else {
          // We've exhausted retry attempts
          setLoading(false);
          setAuthError(new Error('Failed to connect to Supabase after multiple attempts. Please verify that your Supabase project is active and check your internet connection.'));
        }
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);  // Adding timeoutId as a dependency

  // Initial setup on component mount
  useEffect(() => {
    let cleanup: () => void;
    // Set a global fallback timeout to prevent the spinner from showing forever
    const fallbackTimeoutId = window.setTimeout(() => {
      console.warn('Global auth fallback timeout triggered');
      setLoading(false);
    }, 6000);

    // Always skip the initial auth check and loading state
    if (ALWAYS_SKIP_AUTH) {
      console.log('Auth loading disabled - proceeding immediately');
      setLoading(false);
      window.clearTimeout(fallbackTimeoutId);
      return () => {};
    }
    
    // Start the initial session check
    const initAuth = async () => {
      cleanup = await checkSessionAndConnection();
      
      // Listen for auth changes
      const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      });
      
      // Clear the fallback timeout since auth check completed
      window.clearTimeout(fallbackTimeoutId);
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    const authSubscription = initAuth();
    
    // Cleanup function
    return () => {
      window.clearTimeout(fallbackTimeoutId);
      if (cleanup) cleanup();
      authSubscription.then(unsubscribe => unsubscribe());
    };
  }, [checkSessionAndConnection]);  // Adding checkSessionAndConnection as a dependency

  // Function to manually retry the connection
  const retryConnection = useCallback(() => {
    setLoading(true);
    setAuthError(null);
    checkSessionAndConnection();
  }, [checkSessionAndConnection]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId as any)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      // Only set profile if data exists and ensure it's properly typed
      if (data && typeof data === 'object') {
        // Convert to unknown first, then to Profile to satisfy TypeScript
        setProfile(data as unknown as Profile);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { error } = await auth.signInWithPassword({ email, password });
      
      if (error) {
        setAuthError(error);
      }
      
      return { success: !error, error };
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError(error as Error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('Starting signup process with data:', { email, role: userData.role });
      
      // Create the user in auth
      const { data, error } = await auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role
          }
        }
      });
      
      if (error) {
        console.error('Supabase auth signup error:', error);
        setAuthError(error);
        return { success: false, error };
      }
      
      console.log('User created successfully:', data?.user?.id);
      
      if (data?.user) {
        try {
          // Create profile in the profiles table
          const profileData = {
            user_id: data.user.id,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'student',
            language_preference: userData.language_preference || 'en',
            department: userData.department,
            student_id: userData.student_id,
            faculty_id: userData.faculty_id,
            bio: userData.bio,
            avatar_url: userData.avatar_url
          };
          
          console.log('Creating profile with data:', profileData);
          
          // Fix: Add proper typing and use an array for insert
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData as any])  // Fix: Wrap profileData in an array
            .select();  // Add select() to return created data
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
            setAuthError(profileError);
            return { success: false, error: profileError };
          }
          
          console.log('Profile created successfully');
          
          // Update local state with the new user
          setUser(data.user);
          
          // Check if we have a session and set it
          if (data.session) {
            console.log('Setting session from signup response');
            setSession(data.session);
          } else {
            // If signUp doesn't return a session, try to get one
            console.log('No session in signup response, attempting to get session');
            const { data: sessionData } = await auth.getSession();
            if (sessionData?.session) {
              setSession(sessionData.session);
            }
          }
          
          // Fetch the profile we just created
          await fetchProfile(data.user.id);
          
          console.log('Signup process completed successfully');
        } catch (profileCreateError) {
          console.error('Unexpected error creating profile:', profileCreateError);
          setAuthError(profileCreateError as Error);
          return { success: false, error: profileCreateError as Error };
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Signup process failed with error:', error);
      setAuthError(error as Error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { error } = await auth.signOut();
      
      if (error) {
        console.error('Sign out API error:', error);
        setAuthError(error);
        throw error;
      }
      
      setProfile(null);
      setUser(null);
      setSession(null);
      console.log('User successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      const { error } = await auth.resetPasswordForEmail(email);
      
      if (error) {
        setAuthError(error);
      }
      
      return { success: !error, error };
    } catch (error) {
      console.error('Reset password error:', error);
      setAuthError(error as Error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      if (!user) {
        const error = new Error('No authenticated user');
        setAuthError(error);
        return { success: false, error };
      }

      const { error } = await supabase
        .from('profiles')
        .update(data as any)
        .eq('user_id', user.id as any);

      if (error) {
        setAuthError(error);
      } else if (profile) {
        setProfile({ ...profile, ...data });
      }

      return { success: !error, error };
    } catch (error) {
      console.error('Update profile error:', error);
      setAuthError(error as Error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    error: authError,
    connectionAttempts,
    retryConnection,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};