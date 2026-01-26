

## Plano: Corrigir Duplicação de Sessões de Usuários

### Causa Raiz Identificada

O `sendBeacon` no `beforeunload` **falha silenciosamente** porque:
1. Falta o header HTTP `Prefer: return=minimal` exigido pelo PostgREST
2. A RLS policy `"Usuário pode atualizar sua sessão" (user_id = auth.uid())` bloqueia a requisição pois o beacon usa anon key sem JWT

Quando o beacon falha, a sessão antiga permanece "ativa" no banco (sem `logout_at`). Na próxima vez que o usuário acessa, o localStorage está vazio e uma nova sessão é criada.

### Solução

Implementar uma abordagem mais robusta com **duas camadas de proteção**:

#### 1. Verificar sessão ativa do mesmo usuário no banco (não apenas localStorage)

Antes de criar nova sessão, verificar se já existe uma sessão ativa para o mesmo `user_id`:

```typescript
// Em registerSession, antes de inserir
const { data: activeUserSession } = await supabase
  .from('user_sessions')
  .select('id')
  .eq('user_id', user.id)
  .is('logout_at', null)
  .order('login_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (activeUserSession) {
  // Reutilizar sessão existente
  storeSessionId(activeUserSession.id);
  sessionIdRef.current = activeUserSession.id;
  return activeUserSession.id;
}
```

#### 2. Criar constraint UNIQUE parcial no banco

Adicionar constraint que impede múltiplas sessões ativas por usuário:

```sql
CREATE UNIQUE INDEX idx_user_sessions_one_active_per_user 
ON public.user_sessions (user_id) 
WHERE logout_at IS NULL;
```

Isso garante **a nível de banco** que só pode existir uma sessão ativa por usuário.

#### 3. Tratar conflito no INSERT

Quando tentar criar sessão e a constraint bloquear, buscar e reutilizar a sessão existente:

```typescript
const { data, error } = await supabase
  .from('user_sessions')
  .insert({ user_id: user.id, ... })
  .select('id')
  .single();

if (error?.code === '23505') {
  // Unique violation - sessão já existe
  // Buscar a sessão ativa e reutilizá-la
}
```

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSessionTracking.ts` | Adicionar verificação de sessão ativa no banco por `user_id` |
| Migração SQL | Criar índice UNIQUE parcial `idx_user_sessions_one_active_per_user` |

### Limpeza de Dados Existentes

Antes de criar o índice UNIQUE, encerrar sessões duplicadas antigas mantendo apenas a mais recente:

```sql
-- Encerrar sessões antigas (não deletar, apenas fechar)
UPDATE public.user_sessions
SET logout_at = login_at + INTERVAL '1 second',
    logout_type = 'timeout'
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_sessions
  WHERE logout_at IS NULL
  ORDER BY user_id, login_at DESC
)
AND logout_at IS NULL;
```

### Resultado Esperado

- **Uma sessão ativa por usuário** garantida no banco
- Tentativas de criar sessões duplicadas reutilizam a sessão existente
- Dados históricos preservados (apenas marcados como encerrados)

### Impacto

- Usuários com múltiplas abas: todas compartilham a mesma sessão
- Dashboard de sessões: mostrará corretamente uma sessão por usuário online
- Métricas de tempo médio: serão mais precisas

