/**
 * Força a atualização do app limpando caches e service workers
 */
export async function forceAppRefresh(): Promise<void> {
  try {
    // Limpar todos os caches do service worker
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[ForceRefresh] Caches limpos:', cacheNames);
    }

    // Desregistrar todos os service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('[ForceRefresh] Service workers desregistrados:', registrations.length);
    }

    // Forçar reload completo
    window.location.reload();
  } catch (error) {
    console.error('[ForceRefresh] Erro:', error);
    // Mesmo com erro, tenta recarregar
    window.location.reload();
  }
}

/**
 * Detecta o modo de execução do app
 */
export function getAppExecutionMode(): 'browser' | 'pwa' | 'native' {
  // Capacitor/Nativo
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return 'native';
  }
  
  // PWA instalado (standalone)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'pwa';
  }
  
  // iOS Safari standalone
  if ((navigator as any).standalone === true) {
    return 'pwa';
  }
  
  return 'browser';
}

/**
 * Retorna label amigável do modo de execução
 */
export function getAppExecutionModeLabel(): string {
  const mode = getAppExecutionMode();
  switch (mode) {
    case 'native': return 'App Nativo';
    case 'pwa': return 'App Instalado (PWA)';
    case 'browser': return 'Navegador';
  }
}

/**
 * Obtém a versão do build (injetada pelo Vite)
 */
export function getBuildVersion(): string {
  return import.meta.env.VITE_BUILD_ID || 'dev';
}
