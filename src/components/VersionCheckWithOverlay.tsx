import { useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const LOCAL_VERSION = import.meta.env.VITE_BUILD_ID || 'unknown';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const DEFER_DURATION_MS = 30 * 60 * 1000;
const RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

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

  const hasRegisteredRef = useRef(false);
  const checkingRef = useRef(false);
  const deferredUntilRef = useRef<number | null>(null);
  const updateSwRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const updatingRef = useRef(false);

  // ── Register Service Worker ──
  useEffect(() => {
    if (isDevEnvironment) return;
    const isIframe = window.self !== window.top;
    if (isIframe) return;

    const swUpdate = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('🔄 SW: nova versão detectada');
        triggerSilentUpdate();
      },
    });

    updateSwRef.current = swUpdate;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevEnvironment]);

  // ── Force update (silent) ──
  const forceUpdate = useCallback(async () => {
    if (updatingRef.current) return;

    // Cooldown: skip if we already reloaded recently
    try {
      const last = sessionStorage.getItem('lastSilentUpdate');
      if (last && Date.now() - Number(last) < RELOAD_COOLDOWN_MS) {
        console.log('🔄 Reload cooldown ativo, ignorando update');
        return;
      }
    } catch { /* sessionStorage may be unavailable */ }

    updatingRef.current = true;
    console.log('🔄 Atualizando app silenciosamente...');

    try {
      if (updateSwRef.current) {
        await Promise.race([
          updateSwRef.current(false),
          new Promise(resolve => setTimeout(resolve, 5000)),
        ]);
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
    } catch (err) {
      console.warn('Erro ao limpar caches:', err);
    }

    try { sessionStorage.setItem('lastSilentUpdate', String(Date.now())); } catch {}
    window.location.reload();
  }, []);

  // ── Trigger silent update ──
  const triggerSilentUpdate = useCallback(() => {
    if (deferredUntilRef.current && Date.now() < deferredUntilRef.current) return;
    forceUpdate();
  }, [forceUpdate]);

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
        triggerSilentUpdate();
      } else if (LOCAL_VERSION !== 'unknown') {
        registerVersion();
      }
    } catch { /* silent */ } finally {
      checkingRef.current = false;
    }
  }, [registerVersion, triggerSilentUpdate]);

  // ── Periodic + visibility checks ──
  useEffect(() => {
    if (isInactive) return;

    const initialTimeout = setTimeout(checkVersion, 10000);

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

  return null;
}
