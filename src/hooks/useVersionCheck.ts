import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const LOCAL_VERSION = import.meta.env.VITE_BUILD_ID || 'unknown';

interface VersionCheckResult {
  needsUpdate: boolean;
  serverVersion: string | null;
  localVersion: string;
}

/**
 * Hook que verifica ativamente se há uma nova versão do app disponível.
 * Verifica:
 * - Ao montar o componente
 * - Ao voltar do segundo plano (visibilitychange)
 * - Periodicamente a cada 5 minutos
 * 
 * Se detectar versão diferente, força atualização automática.
 */
export function useVersionCheck() {
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef(false);
  const hasShownToastRef = useRef(false);

  const checkVersion = useCallback(async (): Promise<VersionCheckResult> => {
    // Evitar múltiplas verificações simultâneas
    if (isCheckingRef.current) {
      return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
    }

    // Evitar verificações muito frequentes (mínimo 30 segundos entre verificações)
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
    }

    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      const { data, error } = await supabase.functions.invoke('app-version');

      if (error) {
        console.warn('Erro ao verificar versão:', error);
        return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
      }

      const serverVersion = data?.version;

      // Se não há versão no servidor, ignora
      if (!serverVersion) {
        return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
      }

      // Compara versões
      const needsUpdate = serverVersion !== LOCAL_VERSION;

      if (needsUpdate) {
        console.log(`Nova versão disponível: ${serverVersion} (atual: ${LOCAL_VERSION})`);
      }

      return { needsUpdate, serverVersion, localVersion: LOCAL_VERSION };
    } catch (err) {
      console.warn('Falha na verificação de versão:', err);
      return { needsUpdate: false, serverVersion: null, localVersion: LOCAL_VERSION };
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  const forceUpdate = useCallback(async () => {
    console.log('Forçando atualização do app...');
    
    // Mostrar feedback ao usuário
    toast.loading('Atualizando app...', { duration: 2000 });

    try {
      // 1. Limpar caches do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Caches limpos:', cacheNames);
      }

      // 2. Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('Service Workers desregistrados');
      }

      // 3. Aguardar um momento e recarregar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 4. Forçar reload completo (bypass cache)
      window.location.reload();
    } catch (err) {
      console.error('Erro ao forçar atualização:', err);
      // Mesmo com erro, tenta recarregar
      window.location.reload();
    }
  }, []);

  const checkAndUpdate = useCallback(async () => {
    const result = await checkVersion();
    
    if (result.needsUpdate && !hasShownToastRef.current) {
      hasShownToastRef.current = true;
      
      // Para apps instalados (PWA standalone), atualiza automaticamente
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        toast('Atualizando...', {
          description: 'Nova versão detectada. Aplicando atualização.',
          duration: 2000,
        });
        setTimeout(() => forceUpdate(), 1500);
      } else {
        // Para navegador, mostra toast com opção
        toast('Nova versão disponível', {
          description: 'Clique para atualizar o app.',
          duration: Infinity,
          action: {
            label: 'Atualizar',
            onClick: () => forceUpdate(),
          },
        });
      }
    }
  }, [checkVersion, forceUpdate]);

  useEffect(() => {
    // Verificar ao montar (com pequeno delay para não bloquear renderização)
    const initialCheck = setTimeout(() => {
      checkAndUpdate();
    }, 2000);

    // Verificar ao voltar do segundo plano
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App voltou ao foco, verificando versão...');
        checkAndUpdate();
      }
    };

    // Verificar quando app volta do background (para mobile)
    const handleFocus = () => {
      console.log('Window recebeu foco, verificando versão...');
      checkAndUpdate();
    };

    // Verificação periódica
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkAndUpdate();
      }
    }, CHECK_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAndUpdate]);

  return {
    checkVersion,
    forceUpdate,
    localVersion: LOCAL_VERSION,
  };
}
