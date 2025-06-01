import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from 'lib/supabase';
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<Session | null>(null);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // ✅ This is the correct method in v1
    const currentSession = supabase.auth.session();
    setSession(currentSession);

    // ✅ Auth listener
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
};

// Optional: useSession hook
export const useSession = () => useContext(AuthContext);
