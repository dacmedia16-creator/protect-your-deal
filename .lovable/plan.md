

## Remover auto-pause ao sair da aba

**Arquivo:** `src/pages/admin/AdminWhatsApp.tsx`

Remover o trecho do `useEffect` que escuta `visibilitychange` e pausa automaticamente. Manter apenas o `beforeunload` (aviso ao fechar a aba/navegador).

O botão de Pause/Play manual continua disponível para quando o admin quiser pausar por conta própria.

