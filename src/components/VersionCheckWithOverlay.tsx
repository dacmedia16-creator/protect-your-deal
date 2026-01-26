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
 * Compara duas versões no formato "YYYY-MM-DD HH:mm" e retorna true se server > local.
 */
function isServerVersionNewer(serverVersion: string, localVersion: string): boolean {
  try {
    // Formato: "2026-01-23 17:58"
    const serverDate = new Date(serverVersion.replace(' ', 'T'));
    const localDate = new Date(localVersion.replace(' ', 'T'));
    
    // Só precisa atualizar se a versão do servidor for MAIS NOVA
    return serverDate.getTime() > localDate.getTime();
  } catch (err) {
    console.warn('Erro ao comparar versões:', err);
    // Em caso de erro, assume que não precisa atualizar
    return false;
  }
}

/**
 * Componente que verifica atualizações e exibe overlay com countdown.
 */
export function VersionCheckWithOverlay() {
  // Não verificar versão em ambiente de desenvolvimento/preview
  const isDevEnvironment = import.meta.env.DEV || 
    window.location.hostname.includes('lovableproject.com') ||
    window.location.hostname.includes('lovable.app') && window.location.hostname.includes('preview') ||
    window.location.hostname.includes('localhost');

  // Retornar null imediatamente em ambiente de desenvolvimento
  if (isDevEnvironment) {
    return null;
  }

  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const hasRegisteredRef = useRef(false);
  const checkingRef = useRef(false);
  const deferredUntilRef = useRef<number | null>(null);
  const forceUpdateRef = useRef<() => void>();

  // Detect if running as installed PWA
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  /**
   * Força a atualização do app.
   */
  const forceUpdate = useCallback(async () => {
    console.log('🔄 Forçando atualização do app...');

    try {
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
        console.log('✅ Service workers removidos');
      }

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(n => caches.delete(n)));
        console.log('✅ Caches limpos');
      }
    } catch (err) {
      console.warn('Erro ao limpar caches:', err);
    }

    // Always reload, even if cache clearing failed
    console.log('🔄 Recarregando página...');
    window.location.reload();
  }, []);

  // Keep forceUpdateRef always updated
  useEffect(() => {
    forceUpdateRef.current = forceUpdate;
  }, [forceUpdate]);

  // Watch countdown and trigger update when it reaches 0
  useEffect(() => {
    if (showOverlay && countdown === 0) {
      console.log('⏰ Countdown chegou a 0, executando atualização...');
      forceUpdateRef.current?.();
    }
  }, [countdown, showOverlay]);

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

      console.log('✅ Versão registrada:', LOCAL_VERSION);
    } catch (err) {
      console.warn('Falha ao registrar versão:', err);
      hasRegisteredRef.current = false;
    }
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

      // Só precisa atualizar se a versão do servidor for MAIS NOVA que a local
      const needsUpdate = serverVersion !== LOCAL_VERSION 
        && LOCAL_VERSION !== 'unknown'
        && isServerVersionNewer(serverVersion, LOCAL_VERSION);

      // Se a versão local for mais nova ou igual, registra no banco
      if (!needsUpdate && LOCAL_VERSION !== 'unknown') {
        console.log(`📝 Versão local (${LOCAL_VERSION}) >= servidor (${serverVersion}), registrando...`);
        registerVersion();
      }

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
    console.log('🕐 Iniciando countdown de atualização...');
    setCountdown(COUNTDOWN_SECONDS);
    setShowOverlay(true);
  }, []);

  // Separate effect to manage the countdown interval
  // This prevents the interval from being cleared when other state changes
  useEffect(() => {
    if (!showOverlay) {
      return;
    }

    console.log('⏱️ Iniciando intervalo de countdown...');
    
    const intervalId = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        console.log(`⏱️ Countdown: ${next}`);
        return next;
      });
    }, 1000);

    return () => {
      console.log('⏱️ Limpando intervalo de countdown');
      clearInterval(intervalId);
    };
  }, [showOverlay]);

  /**
   * Adia a atualização por 30 minutos.
   */
  const deferUpdate = useCallback(() => {
    deferredUntilRef.current = Date.now() + DEFER_DURATION_MS;
    setShowOverlay(false);
    setCountdown(COUNTDOWN_SECONDS); // Reset for next time
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

  // Handler for "Update Now" button - calls forceUpdate directly
  const handleUpdateNow = useCallback(() => {
    console.log('👆 Botão Atualizar agora clicado');
    forceUpdate();
  }, [forceUpdate]);

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAndUpdate]);

  return (
    <UpdateCountdownOverlay
      isOpen={showOverlay}
      countdown={countdown}
      onUpdateNow={handleUpdateNow}
      onDefer={deferUpdate}
      showDefer={!isStandalone}
    />
  );
}
