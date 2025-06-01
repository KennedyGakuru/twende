import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { supabase } from 'lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isGuestMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  toggleGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    
    if (!result.error) {
      router.replace('/(tabs)');
    }
    
    return { error: result.error };
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await supabase.auth.signUp({ email, password });
    setIsLoading(false);
    
    if (!result.error) {
      router.replace('/(tabs)');
    }
    
    return { error: result.error, data: result.data };
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsGuestMode(false);
    setIsLoading(false);
    router.replace('/(auth)/sign-in');
  };

  const toggleGuestMode = () => {
    setIsGuestMode(!isGuestMode);
    if (!isGuestMode) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  const value = {
    session,
    user,
    isLoading,
    isGuestMode,
    signIn,
    signUp,
    signOut,
    toggleGuestMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}