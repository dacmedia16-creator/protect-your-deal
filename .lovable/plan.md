

# Correção: Preview piscando em loop infinito

## Causa Raiz

O componente `VersionCheckWithOverlay` está detectando uma "nova versão" e forçando reload da página a cada 5 segundos. Como a versão nunca muda após o reload, ele entra em loop infinito de reload.

Os build errors mostrados são de builds anteriores (stale) — o código atual compila com zero erros (`tsc --noEmit --skipLibCheck` = 0 errors).

## O que está acontecendo

1. `VersionCheckWithOverlay` chama a Edge Function `app-version`
2. A versão do servidor (`2026-04-05 21:04`) é mais nova que a local (`2026-04-05 20:57`)
3. Inicia countdown de 5s → força `window.location.reload()`
4. Após reload, a versão local continua a mesma → repete o ciclo

## Bug no `isDevEnvironment`

Embora o hostname do preview inclua `lovableproject.com` (que deveria ser detectado), o efeito `checkAndUpdate` na linha 247 **roda antes** do early return na linha 277. O `startCountdown` seta `showOverlay = true`, e mesmo que o componente retorne `null`, o efeito de countdown continua rodando e eventualmente chama `forceUpdate()` que faz `window.location.reload()`.

## Correção

Mover o guard `isInactive` para DENTRO do `checkAndUpdate` e do `useEffect` que configura os listeners, para que a verificação nem seja executada em ambiente de dev/preview:

```tsx
// No useEffect de setup (linha 247)
useEffect(() => {
  if (isInactive) return; // Guard aqui
  const initialTimeout = setTimeout(checkAndUpdate, 3000);
  // ...
}, [checkAndUpdate, isInactive]);

// No checkAndUpdate (linha 231)  
const checkAndUpdate = useCallback(async () => {
  if (isInactive) return; // Guard aqui também
  const result = await checkVersion();
  // ...
}, [checkVersion, showOverlay, startCountdown, isInactive]);
```

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/VersionCheckWithOverlay.tsx` | Adicionar guards `isInactive` nos effects e callbacks |

## Resultado esperado

- O preview para de recarregar em loop
- Em produção, a verificação de versão continua funcionando normalmente
- Zero impacto na UX

