

# Corrigir overlay de atualização travado no "0"

## Problema
O overlay mostra countdown=0 e "Atualizando agora..." mas nunca recarrega a página. O `forceUpdate` chama `await updateSwRef.current(true)` que pode travar indefinidamente (SW não responde, ou tenta reload internamente e falha dentro do PWA). Como `updatingRef.current = true`, o safety timeout também não consegue fechar o overlay — fica preso.

## Causa raiz
- `registerSW()` retorna uma função que, com `reloadPage=true`, tenta fazer reload internamente — mas dentro de um standalone PWA isso pode falhar ou bloquear
- O `await` não tem timeout, então se a promise do SW nunca resolve, `window.location.reload()` na linha 94 nunca executa
- O safety timeout (15s) verifica `updatingRef.current` e retorna sem fazer nada

## Correção em `src/components/VersionCheckWithOverlay.tsx`

1. **Não passar `reloadPage=true`** ao `updateSwRef.current()` — chamar com `false` para apenas ativar o novo SW sem tentar reload interno (o reload é feito manualmente depois)
2. **Adicionar timeout de 5s** em volta da chamada ao SW update para garantir que, se travar, o fluxo continua
3. **No safety timeout**, se `updatingRef.current` estiver true há mais de 10s, forçar `window.location.reload()` diretamente — nunca ficar preso

Mudança em 1 arquivo, sem impacto em schema ou frontend visual.

