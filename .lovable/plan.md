

## Plano: Otimizar velocidade do login/carregamento para construtoras

### Diagnóstico

O problema tem duas causas:

1. **`useUserRole` faz queries sequenciais**: Após o login, o hook executa 4 chamadas ao banco em série (user_roles → profiles → construtoras → assinaturas), cada uma esperando a anterior terminar. Isso cria um gargalo de ~1-2s.

2. **Edge function `get-imobiliaria-by-email` com fallback lento**: Se o email não está no `profiles`, a função chama `getUserByEmail` no auth (cold start + API call extra). A migração anterior deveria ter corrigido isso, mas novos usuários criados por fluxos antigos podem ainda ter email null.

### Correções

**1. Paralelizar queries no `useUserRole` (src/hooks/useUserRole.tsx)**

Após obter `roleData`, disparar as queries de `profiles`, `construtoras`/`imobiliarias` e `assinaturas` em paralelo com `Promise.all` em vez de sequencialmente.

Trecho atual (sequencial):
```
const profileData = await supabase.from('profiles')...
const constData = await supabase.from('construtoras')...
const assData = await supabase.from('assinaturas')...
```

Trecho novo (paralelo):
```
const [profileResult, constResult, assResult] = await Promise.all([
  supabase.from('profiles').select('ativo').eq('user_id', currentUserId).maybeSingle(),
  supabase.from('construtoras').select('*').eq('id', constId).maybeSingle(),
  supabase.from('assinaturas').select('...').eq('construtora_id', constId)...maybeSingle(),
]);
```

**2. Garantir email no profile via trigger (migração SQL)**

Criar/atualizar o trigger `handle_new_user` para sempre copiar `email` de `auth.users` para `profiles`, evitando o fallback lento na edge function.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email WHERE profiles.email IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Impacto esperado
- Redução de ~50% no tempo de carregamento do role (3 queries paralelas vs sequenciais)
- Eliminação do fallback lento na edge function de logo

