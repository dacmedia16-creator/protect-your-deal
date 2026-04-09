

# Plano: Ocultar overlay de atualização mantendo auto-update

## Resumo

Remover o overlay visual de countdown ("Nova versão disponível") mas manter toda a lógica de detecção e atualização automática funcionando em background.

## Arquivo alterado

`src/components/VersionCheckWithOverlay.tsx`

## Mudança

- Remover o render do `<UpdateCountdownOverlay>` — o componente retorna `null` sempre
- Remover estados visuais (`showOverlay`, `countdown`, `isStandalone`) e o countdown interval
- Simplificar `startCountdown` para chamar `forceUpdate()` diretamente (atualização imediata sem contagem regressiva)
- Remover import de `UpdateCountdownOverlay` e `useState` do countdown

O resultado: quando uma nova versão é detectada (via Edge Function ou Service Worker), o app atualiza silenciosamente sem mostrar nenhuma tela ao usuário.

