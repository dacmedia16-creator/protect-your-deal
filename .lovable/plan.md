

## Diagnóstico: Botões de pagamento não clicáveis

### Causa provável

Existem duas possibilidades principais:

1. **Conta desativada (`ativo = false`)**: No `ProtectedRoute.tsx` (linha 77-85), quando `ativo === false`, toda a página é renderizada com `pointer-events-none`, `opacity-50` e `blur`, bloqueando todos os cliques. Se o perfil do usuário tem `ativo = false`, nenhum botão da página funciona.

2. **`imobiliariaId` é `null`**: Na função `handleSubscribe` (linha 102-103), se `imobiliariaId` não existir, a função retorna silenciosamente sem fazer nada — o botão "clica" mas nada acontece.

Os logs da edge function `asaas-payment-link` estão completamente vazios, o que confirma que a função nunca está sendo chamada.

### Verificação necessária

Preciso verificar no banco de dados:
- Se o perfil do usuário tem `ativo = true`
- Se o `user_roles` tem `imobiliaria_id` preenchido

### Correções

**`src/pages/empresa/EmpresaAssinatura.tsx`**:
- Adicionar feedback visual quando `imobiliariaId` estiver ausente (toast de erro ao invés de retorno silencioso)
- Adicionar log de debug para identificar o problema

```typescript
async function handleSubscribe(planoId: string) {
    if (!imobiliariaId) {
      toast.error('Erro: dados da empresa não carregados. Tente recarregar a página.');
      return;
    }
    // ... resto
}
```

**`src/pages/construtora/ConstutoraAssinatura.tsx`** (mesma correção):
- Adicionar toast de erro quando `construtoraId` estiver ausente

Isso vai pelo menos dar feedback ao usuário sobre o que está acontecendo, em vez de falhar silenciosamente.

