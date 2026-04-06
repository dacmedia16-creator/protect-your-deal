

# Refatoração do Sistema de Atualização

## Resumo
Unificar 3 sistemas independentes em 1 único componente (`VersionCheckWithOverlay`), eliminando duplicidade de requests, conflitos de UI e código morto.

## Mudanças

### 1. Deletar `src/hooks/useVersionCheck.ts`
Código morto — não é importado em lugar nenhum.

### 2. Deletar `src/components/PWAUpdatePrompt.tsx`
Sua lógica de detecção de novo Service Worker será absorvida pelo `VersionCheckWithOverlay`.

### 3. Refatorar `src/main.tsx`
- Remover o `registerSW` do main.tsx (a responsabilidade passa para o `VersionCheckWithOverlay`)
- Manter apenas o guard de iframe/preview para desregistrar SWs existentes

### 4. Refatorar `src/components/VersionCheckWithOverlay.tsx`
Mudanças:
- **Integrar `registerSW`**: chamar `registerSW({ onNeedRefresh })` dentro do componente. Quando `onNeedRefresh` disparar, setar uma flag `swUpdateAvailable` e mostrar o overlay (mesma UI).
- **Fonte única de verdade**: um ref `updateAvailableRef` que é `true` se qualquer das duas fontes (Edge Function ou SW) detectar atualização.
- **Remover listeners redundantes**: manter apenas `visibilitychange` (não precisa de `focus` separado, pois `visibilitychange` já cobre o cenário).
- **Safety timeout**: aumentar de 10s para 15s. Adicionar guard: se `countdown <= 0` (update já disparado), o safety timeout não cancela o overlay.
- **Guardar `updateSW` ref**: quando o overlay dispara `forceUpdate`, chamar `updateSW(true)` primeiro (se disponível) para ativar o novo SW, depois limpar caches e recarregar.

Fluxo unificado:
```text
┌─────────────────────────────────────────┐
│         VersionCheckWithOverlay         │
│                                         │
│  Fonte 1: Edge Function (polling 2min)  │
│  Fonte 2: registerSW onNeedRefresh      │
│           │                             │
│           ▼                             │
│   updateAvailable = true                │
│           │                             │
│           ▼                             │
│   Overlay com countdown 5s              │
│   (standalone: sem botão adiar)         │
│           │                             │
│           ▼                             │
│   forceUpdate():                        │
│     1. updateSW(true) se disponível     │
│     2. unregister SWs                   │
│     3. limpar caches                    │
│     4. window.location.reload()         │
└─────────────────────────────────────────┘
```

### 5. Limpar `src/App.tsx`
- Remover import e `<PWAUpdatePrompt />`
- Manter apenas `<VersionCheckWithOverlay />`

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useVersionCheck.ts` | Deletar |
| `src/components/PWAUpdatePrompt.tsx` | Deletar |
| `src/components/VersionCheckWithOverlay.tsx` | Refatorar (integrar SW + fix timeout) |
| `src/main.tsx` | Simplificar (remover registerSW) |
| `src/App.tsx` | Remover import/montagem de PWAUpdatePrompt |

Nenhuma migração de banco necessária. Nenhuma mudança em Edge Functions.

