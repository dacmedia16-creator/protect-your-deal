

## Plano: Corrigir limite de 1000 usuários em todas as Edge Functions

### Problema

Além da `get-imobiliaria-by-email` (já corrigida), existem **3 outras edge functions** que usam `listUsers()` e são afetadas pelo limite de ~1000 usuários:

### Funções afetadas

**1. `master-login/index.ts`** — Login master
- Usa `listUsers()` para buscar usuário por email
- **Impacto**: Login master não funciona para usuários além dos primeiros 1000
- **Correção**: Usar `supabaseAdmin.auth.admin.getUserByEmail(email)` (API nativa do admin client que não tem limite)

**2. `admin-get-corretores-emails/index.ts`** — Buscar emails de corretores
- Usa `listUsers()` para criar mapa user_id → email
- **Impacto**: Corretores após os primeiros 1000 aparecem sem email na listagem admin
- **Correção**: Buscar emails diretamente da tabela `profiles` (que já tem campo `email`)

**3. `admin-list-users/index.ts`** — Listar todos usuários (admin)
- Usa `listUsers({ perPage: 1000 })` para listar todos
- **Impacto**: Admin só vê os primeiros 1000 usuários
- **Correção**: Implementar paginação com `listUsers({ page, perPage })` iterando até buscar todos, ou buscar dados da tabela `profiles` + `user_roles`

### Detalhes técnicos

| Função | Solução | Complexidade |
|--------|---------|-------------|
| `master-login` | `getUserByEmail(email)` | Simples |
| `admin-get-corretores-emails` | Query em `profiles` pelo email | Simples |
| `admin-list-users` | Paginação loop ou query `profiles` + `user_roles` | Média |

### Alterações

**`master-login/index.ts`**
```typescript
// Substituir listUsers() + find por:
const { data: { user: targetUser }, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
```

**`admin-get-corretores-emails/index.ts`**
```typescript
// Substituir listUsers() + map por query em profiles:
const { data: profiles } = await supabaseAdmin
  .from('profiles')
  .select('user_id, email')
  .in('user_id', userIds);
const emailsMap = Object.fromEntries(profiles.map(p => [p.user_id, p.email]));
```

**`admin-list-users/index.ts`**
```typescript
// Paginar para buscar todos os usuários:
let allUsers = [];
let page = 1;
while (true) {
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
  allUsers.push(...users);
  if (users.length < 1000) break;
  page++;
}
```

