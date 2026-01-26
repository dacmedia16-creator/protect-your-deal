import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const SESSION_ID_KEY = 'vp_session_id';

interface SessionTrackingOptions {
  isImpersonation?: boolean;
}

export function useSessionTracking() {
  const sessionIdRef = useRef<string | null>(null);

  // Get stored session ID
  const getStoredSessionId = useCallback(() => {
    try {
      return localStorage.getItem(SESSION_ID_KEY);
    } catch {
      return null;
    }
  }, []);

  // Store session ID
  const storeSessionId = useCallback((id: string) => {
    try {
      localStorage.setItem(SESSION_ID_KEY, id);
      sessionIdRef.current = id;
    } catch {
      sessionIdRef.current = id;
    }
  }, []);

  // Clear session ID
  const clearSessionId = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_ID_KEY);
    } catch {
      // Ignore errors
    }
    sessionIdRef.current = null;
  }, []);

  // Get user's imobiliaria_id
  const getUserImobiliariaId = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('imobiliaria_id')
        .eq('user_id', userId)
        .not('imobiliaria_id', 'is', null)
        .maybeSingle();
      return data?.imobiliaria_id || null;
    } catch {
      return null;
    }
  }, []);

  // Register new session (on login)
  const registerSession = useCallback(async (
    user: User, 
    options: SessionTrackingOptions = {}
  ): Promise<string | null> => {
    try {
      // Check if there's already an active session
      const existingSessionId = getStoredSessionId();
      if (existingSessionId) {
        const { data: existingSession } = await supabase
          .from('user_sessions')
          .select('id, logout_at')
          .eq('id', existingSessionId)
          .maybeSingle();
        
        // Session still active, don't create new one
        if (existingSession && !existingSession.logout_at) {
          sessionIdRef.current = existingSessionId;
          return existingSessionId;
        }
      }

      const imobiliariaId = await getUserImobiliariaId(user.id);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          imobiliaria_id: imobiliariaId,
          user_agent: navigator.userAgent,
          is_impersonation: options.isImpersonation || false,
        })
        .select('id')
        .single();

      if (error) {
        console.warn('Failed to register session:', error.message);
        return null;
      }

      if (data?.id) {
        storeSessionId(data.id);
        return data.id;
      }
      return null;
    } catch (error) {
      console.warn('Failed to register session:', error);
      return null;
    }
  }, [getUserImobiliariaId, storeSessionId, getStoredSessionId]);

  // End session (on logout)
  const endSession = useCallback(async (logoutType: 'manual' | 'browser_close' | 'timeout' = 'manual') => {
    const sessionId = sessionIdRef.current || getStoredSessionId();
    
    if (!sessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          logout_at: new Date().toISOString(),
          logout_type: logoutType,
        })
        .eq('id', sessionId);
    } catch (error) {
      console.warn('Failed to end session:', error);
    } finally {
      clearSessionId();
    }
  }, [getStoredSessionId, clearSessionId]);

  // End session using sendBeacon (for beforeunload)
  const endSessionBeacon = useCallback(() => {
    const sessionId = sessionIdRef.current || getStoredSessionId();
    
    if (!sessionId) return;

    // Use sendBeacon for reliable delivery on page unload
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?id=eq.${sessionId}`;
    const body = JSON.stringify({
      logout_at: new Date().toISOString(),
      logout_type: 'browser_close',
    });

    try {
      navigator.sendBeacon(
        url,
        new Blob([body], { type: 'application/json' })
      );
    } catch {
      // Fallback: try regular fetch
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body,
        keepalive: true,
      }).catch(() => {
        // Ignore errors on page unload
      });
    }

    clearSessionId();
  }, [getStoredSessionId, clearSessionId]);

  // Setup beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = sessionIdRef.current || getStoredSessionId();
      if (sessionId) {
        endSessionBeacon();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Restore session ID from storage on mount
    const storedId = getStoredSessionId();
    if (storedId) {
      sessionIdRef.current = storedId;
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [getStoredSessionId, endSessionBeacon]);

  return {
    registerSession,
    endSession,
    getStoredSessionId,
  };
}
