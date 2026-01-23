import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UpdateCountdownOverlay } from './UpdateCountdownOverlay';

const LOCAL_VERSION = import.meta.env.VITE_BUILD_ID || 'unknown';
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const DEFER_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const COUNTDOWN_SECONDS = 5;

interface VersionCheckResult {
  needsUpdate: boolean;
  serverVersion: string | null;
  localVersion: string;
}

/**
 * Componente que verifica atualizações e exibe overlay com countdown.
 * Substitui o VersionCheck.tsx original.
 */
export function VersionCheckWithOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const hasRegisteredRef = useRef(false);
  const checkingRef = useRef(false);
  const deferredUntilRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if running as installed PWA
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  /**
   * Registra a versão atual no banco de dados.
   */
  const registerVersion = useCallback(async () => {
    if (hasRegisteredRef.current) return;
    if (LOCAL_VERSION === 'unknown') return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    hasRegisteredRef.current = true;

    try {
      const { error } = await supabase.functions.invoke('register-version', {
        body: { version: LOCAL_VERSION }
      });

      if (error) {
        console.warn('Erro ao registrar versão:', error);
        hasRegisteredRef.current = false;
        return;
      }

      const { data } = await supabase.functions.invoke('register-version', {
        body: { version: LOCAL_VERSION }
      });
      
      if (data?.registered) {
        console.log('✅ Versão registrada:', LOCAL_VERSION);
      }
    } catch (err) {
      console.warn('Falha ao registrar versão:', err);
      hasRegisteredRef.current = false;
    }
  }, []);

  /**
   * Força a atualização do app.
   */
  const forceUpdate = useCallback(async () => {
    console.log('🔄 Forçando atualização do app...');
    
    // Clear any countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Unregister service workers and clear caches
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }

    window.location.reload();
  }, []);

  /**
   * Verifica se há uma nova versão disponível.
   */
  const checkVersion = useCallback(async (): Promise<VersionCheckResult> => {
    // Check if deferred
    if (deferredUntilRef.current && Date.now() < deferredUntilRef.current) {
      return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
    }

    if (checkingRef.current) {
      return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
    }

    checkingRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('app-version');

      if (error) {
        console.warn('Erro ao verificar versão:', error);
        return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
      }

      const serverVersion = data?.version;

      // If no version in DB, try to register current version
      if (!serverVersion) {
        await registerVersion();
        return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
      }

      const needsUpdate = serverVersion !== LOCAL_VERSION && LOCAL_VERSION !== 'unknown';

      return { needsUpdate, serverVersion, localVersion: LOCAL_VERSION };
    } catch (err) {
      console.warn('Falha ao verificar versão:', err);
      return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
    } finally {
      checkingRef.current = false;
    }
  }, [registerVersion]);

  /**
   * Inicia o countdown e exibe o overlay.
   */
  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    setShowOverlay(true);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          // Trigger update
          forceUpdate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [forceUpdate]);

  /**
   * Adia a atualização por 30 minutos.
   */
  const deferUpdate = useCallback(() => {
    deferredUntilRef.current = Date.now() + DEFER_DURATION_MS;
    setShowOverlay(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    console.log('⏰ Atualização adiada por 30 minutos');
  }, []);

  /**
   * Verifica e inicia countdown se necessário.
   */
  const checkAndUpdate = useCallback(async () => {
    const result = await checkVersion();
    
    if (result.needsUpdate && !showOverlay) {
      console.log(`🆕 Nova versão detectada: ${result.serverVersion} (atual: ${result.localVersion})`);
      startCountdown();
    }
  }, [checkVersion, showOverlay, startCountdown]);

  // Setup checks on mount and visibility changes
  useEffect(() => {
    // Initial check after a short delay
    const initialTimeout = setTimeout(checkAndUpdate, 3000);

    // Check on visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdate();
      }
    };

    // Check on window focus
    const handleFocus = () => {
      checkAndUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic check
    const intervalId = setInterval(checkAndUpdate, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAndUpdate]);

  return (
    <UpdateCountdownOverlay
      isOpen={showOverlay}
      countdown={countdown}
      onUpdateNow={forceUpdate}
      onDefer={deferUpdate}
      showDefer={!isStandalone}
    />
  );
}
