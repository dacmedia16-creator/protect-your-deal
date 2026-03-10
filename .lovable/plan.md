

## Problema

A edge function `admin-delete-user` está falhando com `AuthSessionMissingError` ao chamar `supabaseUser.auth.getUser()`. Os logs confirmam isso. O mesmo padrão de autenticação (criar um segundo client com o header) está instável em versões recentes do SDK no Deno.

A solução mais robusta é extrair o JWT token do header e usar `supabaseAdmin.auth.getUser(token)` diretamente, que não depende de sessão local.

## Correção

**Arquivo:** `supabase/functions/admin-delete-user/index.ts`

Substituir o padrão de dois clients por extração direta do token:

```typescript
// ANTES (falha com AuthSessionMissingError):
const supabaseUser = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } },
  auth: { autoRefreshToken: false, persistSession: false }
});
const { data: { user } } = await supabaseUser.auth.getUser();

// DEPOIS (usa admin client com token explícito):
const token = authHeader.replace('Bearer ', '');
const { data: { user } } = await supabaseAdmin.auth.getUser(token);
```

Remover a criação do `supabaseUser` client completamente — todas as queries já usam `supabaseAdmin`.

