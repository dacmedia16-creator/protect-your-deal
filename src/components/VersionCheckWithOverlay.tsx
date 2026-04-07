import { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UpdateCountdownOverlay } from './UpdateCountdownOverlay';

const LOCAL_VERSION = import.meta.env.VITE_BUILD_ID || 'unknown';
const CHECK_INTERVAL_MS = 1 * 60 * 1000;
const DEFER_DURATION_MS = 30 * 60 * 1000;
const COUNTDOWN_SECONDS = 5;
const SAFETY_TIMEOUT_MS = 15 * 1000;

function isServerVersionNewer(serverVersion: string, localVersion: string): boolean {
  try {
    const serverDate = new Date(serverVersion.replace(' ', 'T'));
    const localDate = new Date(localVersion.replace(' ', 'T'));
    return serverDate.getTime() > localDate.getTime();
  } catch {
    return false;
  }
}

export function VersionCheckWithOverlay() {
  const { user } = useAuth();

  const isDevEnvironment = import.meta.env.DEV ||
    window.location.hostname.includes('lovableproject.com') ||
    (window.location.hostname.includes('lovable.app') && window.location.hostname.includes('preview')) ||
    window.location.hostname.includes('localhost');

  const isInactive = isDevEnvironment || !user;

  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isStandalone, setIsStandalone] = useState(false);

  const hasRegisteredRef = useRef(false);
  const checkingRef = useRef(false);
  const deferredUntilRef = useRef<number | null>(null);
  const updateSwRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const updatingRef = useRef(false);
  const updatingStartedAtRef = useRef<number>(0);

  // Detect standalone mode
  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  // ── Register Service Worker (single source) ──
  useEffect(() => {
    if (isDevEnvironment) return;
    const isIframe = window.self !== window.top;
    if (isIframe) return;

    const swUpdate = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('🔄 SW: nova versão detectada');
        startCountdown();
      },
    });

    updateSwRef.current = swUpdate;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevEnvironment]);

  // ── Force update ──
  const forceUpdate = useCallback(async () => {
    if (updatingRef.current) return;
    updatingRef.current = true;
    updatingStartedAtRef.current = Date.now();
    console.log('🔄 Forçando atualização do app...');

    try {
      // 1. Activate new SW WITHOUT internal reload (false) + 5s timeout
      if (updateSwRef.current) {
        await Promise.race([
          updateSwRef.current(false),
          new Promise(resolve => setTimeout(resolve, 5000)),
        ]);
      }
      // 2. Unregister all SWs
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      // 3. Clear caches
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
    } catch (err) {
      console.warn('Erro ao limpar caches:', err);
    }

    window.location.reload();
  }, []);

  // ── Register version ──
  const registerVersion = useCallback(async () => {
    if (hasRegisteredRef.current || LOCAL_VERSION === 'unknown') return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    hasRegisteredRef.current = true;
    try {
      const { error } = await supabase.functions.invoke('register-version', {
        body: { version: LOCAL_VERSION },
      });
      if (error) { hasRegisteredRef.current = false; }
    } catch { hasRegisteredRef.current = false; }
  }, []);

  // ── Check version via Edge Function ──
  const checkVersion = useCallback(async () => {
    if (deferredUntilRef.current && Date.now() < deferredUntilRef.current) return;
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('app-version');
      if (error) return;

      const serverVersion = data?.version;
      if (!serverVersion) { await registerVersion(); return; }

      const needsUpdate = serverVersion !== LOCAL_VERSION
        && LOCAL_VERSION !== 'unknown'
        && isServerVersionNewer(serverVersion, LOCAL_VERSION);

      if (needsUpdate) {
        console.log(`🆕 Versão servidor ${serverVersion} > local ${LOCAL_VERSION}`);
        startCountdown();
      } else if (LOCAL_VERSION !== 'unknown') {
        registerVersion();
      }
    } catch { /* silent */ } finally {
      checkingRef.current = false;
    }
  }, [registerVersion]);

  // ── Start countdown (idempotent) ──
  const startCountdown = useCallback(() => {
    setShowOverlay(prev => {
      if (prev) return prev; // already showing
      setCountdown(COUNTDOWN_SECONDS);
      return true;
    });
  }, []);

  // ── Countdown interval ──
  useEffect(() => {
    if (!showOverlay) return;
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showOverlay]);

  // ── Trigger update when countdown reaches 0 ──
  useEffect(() => {
    if (showOverlay && countdown === 0) {
      forceUpdate();
    }
  }, [countdown, showOverlay, forceUpdate]);

  // ── Safety timeout (don't cancel if already updating) ──
  useEffect(() => {
    if (!showOverlay) return;
    const id = setTimeout(() => {
      if (updatingRef.current) return; // don't interrupt active update
      setShowOverlay(false);
      setCountdown(COUNTDOWN_SECONDS);
      deferredUntilRef.current = Date.now() + 60_000;
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [showOverlay]);

  // ── Defer ──
  const deferUpdate = useCallback(() => {
    deferredUntilRef.current = Date.now() + DEFER_DURATION_MS;
    setShowOverlay(false);
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  // ── Periodic + visibility checks ──
  useEffect(() => {
    if (isInactive) return;

    const initialTimeout = setTimeout(checkVersion, 1500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') checkVersion();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkVersion, isInactive]);

  if (isInactive) return null;

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
