

## Correção: Step 1 (Modo) pula automaticamente

### Problema
O `useEffect` na linha 252 escuta `modoCriacao` e faz `setCurrentStep(1)`. Como `modoCriacao` já inicia com `'completo'`, o efeito dispara no mount e pula o step "Modo" antes do usuário interagir.

### Solução

**`src/pages/NovaFicha.tsx`**:

1. **Remover o `useEffect` das linhas 252-256** que auto-avança o step quando `modoCriacao` muda.

2. **No step "Modo"**: Manter o RadioGroup normalmente — o usuário escolhe o modo e clica "Próximo" para avançar. O wizard não deve avançar automaticamente.

Isso é tudo. Uma remoção de 4 linhas resolve o problema.

