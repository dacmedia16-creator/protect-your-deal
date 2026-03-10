

## Corrigir AuthSessionMissingError em todas as Edge Functions

### Problema

11 edge functions usam o padrão `supabaseUser.auth.getUser()` (criando um segundo client com o Authorization header), que falha com `AuthSessionMissingError` em versões recentes do SDK. O `admin-delete-user` foi corrigido no código mas as outras não.

### Solução

Aplicar a mesma correção em todas as 11 funções: extrair o token JWT do header e usar `supabaseAdmin.auth.getUser(token)` diretamente, removendo o `supabaseUser` client.

### Funções afetadas

1. `admin-list-users/index.ts`
2. `admin-create-user/index.ts`
3. `admin-update-user/index.ts`
4. `admin-reset-password/index.ts`
5. `admin-create-corretor/index.ts`
6. `admin-get-corretores-emails/index.ts`
7. `admin-vincular-usuario/index.ts`
8. `admin-promote-corretor/index.ts`
9. `admin-criar-acesso-afiliado/index.ts`
10. `create-survey/index.ts`
11. `send-email/index.ts`

### Padrão da correção (em cada arquivo)

```typescript
// REMOVER: criação do supabaseUser client
// REMOVER: supabaseUser.auth.getUser()

// SUBSTITUIR POR:
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
```

### Escopo
- Editar 11 edge functions
- Nenhuma mudança no frontend ou banco

