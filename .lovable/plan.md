

## Diagnóstico: Por que o Super Admin viu "Conta Pendente"

### O que aconteceu

Pelos logs de autenticação, a sequência foi:

1. A sessão anterior do usuário expirou (`session_not_found` nos logs às 17:32-17:36)
2. O refresh token também era inválido (`refresh_token_not_found` às 17:39:47)
3. O usuário fez login novamente com sucesso às 17:39:54
4. **Após o login**, o `useUserRole` tentou buscar o role na tabela `user_roles`, mas provavelmente falhou silenciosamente (erro de rede, timeout, ou race condition)
5. Como o role ficou `null`, o código em `Auth.tsx` (linha 88) redirecionou para `/sem-permissao`

### A falha no código

Em `Auth.tsx` linha 86-88:
```typescript
} else {
  // role é null → redireciona para /sem-permissao
  navigate('/sem-permissao');
}
```

O problema: **não distingue "erro ao buscar role" de "usuário realmente sem role"**. Se a query do `user_roles` falhar por qualquer motivo transitório (rede, timeout), o `role` fica `null` e o usuário é mandado para a página de erro.

No `useUserRole`, o `catch` na linha ~195 apenas loga o erro e segue, deixando `role = null` e marcando `fetchedForUserId`, o que faz `isLoading = false` e dispara o redirect.

### Plano de Correção

#### 1. Adicionar estado `error` ao `useUserRole` + retry automático
- Expor `error: boolean` no contexto
- Se a query de `user_roles` falhar, tentar novamente 1x antes de desistir
- Arquivo: `src/hooks/useUserRole.tsx`

#### 2. Corrigir redirect no `Auth.tsx`
- Só redirecionar para `/sem-permissao` se não houve erro na busca do role
- Se houve erro, mostrar toast com botão de retry em vez de redirecionar
- Arquivo: `src/pages/Auth.tsx`

#### 3. Adicionar botão "Tentar novamente" na página `SemPermissao`
- Chamar `refetch()` do `useUserRole`
- Se role for encontrado, redirecionar automaticamente para o dashboard correto
- Arquivo: `src/pages/SemPermissao.tsx`

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useUserRole.tsx` | Adicionar `error` ao contexto + retry 1x automático |
| `src/pages/Auth.tsx` | Não redirecionar para `/sem-permissao` se houve erro |
| `src/pages/SemPermissao.tsx` | Botão "Tentar novamente" com refetch + redirect |

