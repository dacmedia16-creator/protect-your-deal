

# Fix: App preso na tela de loading ("Verificando permissões...")

## Causa raiz

A mudança recente no `VersionCheckWithOverlay` para atualizar silenciosamente está causando um **loop de reload infinito**:

1. Página carrega → `useUserRole` começa a buscar role
2. 1.5s depois: version check dispara → detecta versão nova → `window.location.reload()`
3. Página recarrega → role fetch reinicia
4. 1.5s depois: mesmo ciclo

O usuário nunca sai da tela de loading porque a página recarrega antes do role fetch completar.

## Solução

Arquivo: `src/components/VersionCheckWithOverlay.tsx`

1. **Atrasar o check inicial** de 1.5s para 10s, dando tempo para role/auth carregar
2. **Guardar flag no sessionStorage** para evitar reload repetido na mesma sessão (se já recarregou por update, não recarregar novamente por 5 minutos)
3. **Usar `deferredUntilRef`** após cada reload para prevenir loop

Mudanças específicas:
- Linha 135: mudar timeout de `1500` para `10000` (10s)
- Em `forceUpdate`: antes de `reload()`, gravar `sessionStorage.setItem('lastSilentUpdate', Date.now())` 
- Em `triggerSilentUpdate`: checar se `lastSilentUpdate` foi há menos de 5 minutos; se sim, ignorar
- Aumentar `CHECK_INTERVAL_MS` de 1 min para 5 min para reduzir checks desnecessários

## Resultado

O app terá tempo para carregar roles/auth antes de qualquer tentativa de update silencioso, e nunca entrará em loop de reload.

