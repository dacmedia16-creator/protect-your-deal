

## Ocultar desconto simbólico de cupons de rastreamento

### Problema
Quando o usuário acessa via link de afiliado (`?aff=`), o cupom de rastreamento com desconto simbólico de 0.01% é mostrado na tela. A mensagem "0.01% de desconto aplicado!" confunde o usuário e parece pouco profissional.

### Solução
Quando o cupom aplicado tem `valor_desconto <= 0.01` (cupom de rastreamento puro), **não exibir** a linha de desconto. Manter apenas a mensagem "Cupom aplicado automaticamente via link de indicação".

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/auth/RegistroCorretorAutonomo.tsx` | Condicionar exibição do desconto: só mostrar se `valor_desconto > 0.01` |
| `src/pages/auth/RegistroImobiliaria.tsx` | Mesma alteração |

### Lógica

```tsx
// Antes (sempre mostra):
{cupomInfo?.valido && (
  <p>✓ {valor}% de desconto aplicado!</p>
)}

// Depois (oculta desconto simbólico):
{cupomInfo?.valido && cupomInfo.valor_desconto > 0.01 && (
  <p>✓ {valor}% de desconto aplicado!</p>
)}
```

Quando for cupom de rastreamento (≤ 0.01%), o usuário verá apenas:
- ✓ Cupom aplicado automaticamente via link de indicação

Quando for cupom promocional real (ex: 10%), verá:
- ✓ Cupom aplicado automaticamente via link de indicação
- ✓ 10% de desconto aplicado!

