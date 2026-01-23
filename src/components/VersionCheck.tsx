import { useVersionCheck } from '@/hooks/useVersionCheck';

/**
 * Componente invisível que ativa a verificação de versão do app.
 * Deve ser montado no App.tsx para funcionar em todas as páginas.
 */
export function VersionCheck() {
  useVersionCheck();
  return null;
}
