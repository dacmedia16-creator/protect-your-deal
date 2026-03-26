

## Plano: Corrigir logo da construtora não aparecendo no login

### Problema raiz
O email do usuário construtora não está salvo na tabela `profiles`. A edge function `get-imobiliaria-by-email` busca por `profiles.email`, mas o campo está `NULL` porque a função `admin-create-user` não inclui `email` no update do profile. O trigger `handle_new_user` também não salva o email.

Dados confirmados: o usuário "Amaral" (construtora "Planeta") tem `email: null` no profile.

### Correções (2 partes)

**1. Atualizar `supabase/functions/admin-create-user/index.ts`**
- Na linha ~156, adicionar `email` ao `profileUpdate`:
```typescript
const profileUpdate: any = {
  nome,
  email,  // ← ADICIONAR
  telefone: telefone || null,
  creci: creci || null,
};
```

**2. Atualizar `supabase/functions/get-imobiliaria-by-email/index.ts`**
- Adicionar fallback: se `profiles` não encontrar por email, buscar na `user_roles` via auth (precisa buscar o user pelo email no auth). Mais simples: buscar o email no auth.users e depois buscar o profile pelo user_id.
- Fluxo atualizado:
  1. Tentar buscar em `profiles` por email (atual)
  2. Se não encontrar, usar `supabaseAdmin.auth.admin.listUsers()` para encontrar o user_id pelo email
  3. Se encontrou user_id, buscar `profiles` por `user_id` e pegar `construtora_id`/`imobiliaria_id`

**3. Migração SQL para corrigir dados existentes**
```sql
-- Preencher email dos profiles que estão null usando auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;
```

### Resumo
- A causa é `email = null` no profile
- A correção mais robusta é: corrigir o `admin-create-user` para sempre salvar o email, corrigir dados existentes via migração, e adicionar fallback no `get-imobiliaria-by-email`
