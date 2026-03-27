

## Plano: Corrigir contagem de "Confirmadas" no card de imobiliária parceira

### Problema
A contagem de fichas confirmadas mostra 0 porque o código verifica `status === 'confirmado'`, mas os status reais de confirmação são `'completo'` e `'finalizado_parcial'` (definidos em `STATUS_CONFIRMADO`).

### Solução

Alterar `src/pages/construtora/ConstutoraImobiliarias.tsx` linha 107:

- Importar `isFichaConfirmada` de `@/lib/fichaStatus`
- Substituir `if (f.status === 'confirmado')` por `if (isFichaConfirmada(f.status))`

Alteração de uma linha, sem migração necessária.

