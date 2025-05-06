import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, auth } from '../config/supabase';
import { Profile } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setAuthError(error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Unexpected error during session check:', err);
        setAuthError(err as Error);
      } finally {
        // Always set loading to false to prevent infinite loading
        setLoading(false);
      }
    };

    checkSession();

    // Add a safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timed out after 10 seconds');
        setLoading(false);
        setAuthError(new Error('Authentication check timed out'));
      }
    }, 10000); // 10 second timeout

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

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await auth.signInWithPassword({ email, password });
      return { success: !error, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      setLoading(true);
      
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
        return { success: false, error };
      }
      
      if (data.user) {
        // Create profile in the profiles table
        const { error: profileError } = await supabase.from('profiles').insert({
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
        });
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          return { success: false, error: profileError };
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await auth.signOut();
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await auth.resetPasswordForEmail(email);
      return { success: !error, error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setLoading(true);
      
      if (!user) {
        return { success: false, error: new Error('No authenticated user') };
      }

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...data });
      }

      return { success: !error, error };
    } catch (error) {
      console.error('Update profile error:', error);
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