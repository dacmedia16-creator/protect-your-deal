

## Plano: Corrigir busca de imobiliária por email no login

### Problema

A edge function `get-imobiliaria-by-email` chama `supabaseAdmin.auth.admin.listUsers()` sem filtro e busca o email na lista retornada (máx. ~1000 usuários). Usuários além desse limite não são encontrados, então o logo da imobiliária nunca aparece.

### Solução

Substituir a busca por `listUsers()` por uma query direta na tabela `profiles` usando o campo `email` (que já existe na tabela profiles), eliminando a dependência do `auth.admin.listUsers()`.

### Alteração

**Arquivo: `supabase/functions/get-imobiliaria-by-email/index.ts`**

Reescrever a lógica para:
1. Buscar diretamente em `profiles` pelo email (em vez de listar todos os auth users)
2. Se encontrar, buscar os dados da imobiliária pelo `imobiliaria_id`
3. Remover as chamadas `listUsers()` completamente

```typescript
// Em vez de:
const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers()
const user = allUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

// Usar:
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('imobiliaria_id')
  .ilike('email', email)
  .maybeSingle()
```

Isso resolve o problema de escala e torna a busca mais eficiente.

### Detalhes técnicos

- A tabela `profiles` tem campo `email` que é sincronizado com o auth
- Usar `ilike` para busca case-insensitive
- Se `profiles` não tiver campo `email`, buscar via `auth.admin.listUsers({ filter: email })` — mas a API do Supabase GoTrue não suporta filtro por email no `listUsers`, então a alternativa é usar `getUserByEmail` (disponível no admin client) caso não haja email em profiles

