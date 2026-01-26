import { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL } from '@/lib/appConfig';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { registerSession, endSession } = useSessionTracking();
  const hasRegisteredSession = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Register session on sign in (only once per session)
        if (event === 'SIGNED_IN' && session?.user && !hasRegisteredSession.current) {
          hasRegisteredSession.current = true;
          // Defer to avoid blocking auth flow
          setTimeout(() => {
            registerSession(session.user).catch(console.warn);
          }, 100);
        }

        // Reset flag on sign out
        if (event === 'SIGNED_OUT') {
          hasRegisteredSession.current = false;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [registerSession]);

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${APP_URL}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // End session tracking before logout
    try {
      await endSession('manual');
    } catch (err) {
      console.warn('Failed to end session tracking:', err);
    }

    // Verificar se há sessão antes de tentar logout
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      // Já está deslogado, apenas limpar estado local
      setUser(null);
      setSession(null);
      hasRegisteredSession.current = false;
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    
    // Mesmo com erro, limpar estado local
    setUser(null);
    setSession(null);
    hasRegisteredSession.current = false;
    
    // Ignorar erro "Session not found" - não é problema real
    if (error && !error.message.includes('session_not_found') && !error.message.includes('Session not found')) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
