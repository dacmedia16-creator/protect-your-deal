

## Corrigir admin-update-corretor com o mesmo padrão de autenticação

### Problema
A função `admin-update-corretor/index.ts` (linhas 37-54) ainda usa o padrão antigo de dois clients:
```typescript
const supabaseAuth = createClient(url, anonKey, { ... Authorization: authHeader });
const { data: { user } } = await supabaseAuth.auth.getUser(); // FALHA
```

### Correção
Substituir pelo padrão já aplicado nas outras 13 funções: extrair o token e usar `supabaseAdmin.auth.getUser(token)`.

**Arquivo:** `supabase/functions/admin-update-corretor/index.ts`
- Remover `supabaseAnonKey` e `supabaseAuth` client
- Extrair token: `const token = authHeader.replace('Bearer ', '')`
- Usar: `supabaseAdmin.auth.getUser(token)`

### Escopo
- 1 arquivo editado
- Nenhuma mudança no frontend ou banco

