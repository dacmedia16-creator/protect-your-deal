

## Acesso normal para conta cancelada até fim do período

### Problema
Hoje, `cancelada` é tratada igual a `suspensa` — bloqueia acesso imediatamente. O correto é permitir acesso até `data_fim` e só bloquear depois.

### Solução
Duas alterações simples:

#### 1. `src/hooks/useUserRole.tsx` — Tratar cancelada com período vigente
Após o check de trial expirado (linha ~217), adicionar lógica similar para `cancelada`:
- Se `status === 'cancelada'` e `data_fim` existe e ainda não expirou → manter status como `cancelada` (não bloqueia)
- Se `data_fim` já passou → mudar status para `suspensa` (bloqueia)

```typescript
// After trial check, add:
if (assinData.status === 'cancelada' && assinData.data_fim) {
  const endDate = new Date(assinData.data_fim + 'T23:59:59');
  if (endDate < new Date()) {
    assinData.status = 'suspensa'; // período expirou, bloquear
  }
}
```

#### 2. `src/components/ProtectedRoute.tsx` — Remover `cancelada` do bloqueio
Na linha 70, remover `assinatura.status === 'cancelada'` da condição de bloqueio. Assim:
- `cancelada` com período vigente → acesso normal
- `cancelada` com período expirado → já foi convertida para `suspensa` no hook → bloqueada

**Antes:**
```typescript
if (!assinatura || assinatura.status === 'suspensa' || assinatura.status === 'cancelada' || assinatura.status === 'pendente')
```

**Depois:**
```typescript
if (!assinatura || assinatura.status === 'suspensa' || assinatura.status === 'pendente')
```

### Resultado
- Conta cancelada com período ativo → acesso normal ao sistema
- Conta cancelada com período expirado → redirecionada para tela de reativação
- Sem cobrança futura (já cancelada no Asaas)

