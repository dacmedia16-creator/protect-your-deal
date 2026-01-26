

## Plano: Corrigir Múltiplas Sessões Duplicadas

### Problema Identificado

Analisando os dados do banco, encontrei:
- 3 sessões criadas para o mesmo usuário em menos de 15 segundos
- Sessões com duração negativa (-90s, -107s)
- O `hasRegisteredSession.current` não está funcionando corretamente

### Causa Raiz

1. **Múltiplos eventos `SIGNED_IN`**: O Supabase dispara este evento em várias situações (login, refresh de token, navegação)
2. **Dependência instável no useEffect**: O `registerSession` está nas dependências do useEffect, causando re-execução
3. **Falta de verificação de sessão existente**: Não verifica se já existe uma sessão ativa no localStorage antes de criar nova

### Solução Proposta

#### 1. Verificar sessão existente antes de registrar

Antes de inserir nova sessão, verificar se:
- Já existe `session_id` no localStorage
- A sessão ainda está ativa (sem `logout_at`)

```typescript
// Em registerSession
const existingSessionId = getStoredSessionId();
if (existingSessionId) {
  // Verificar se sessão ainda está ativa no banco
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id, logout_at')
    .eq('id', existingSessionId)
    .maybeSingle();
  
  if (existingSession && !existingSession.logout_at) {
    // Sessão ainda ativa, não criar nova
    return existingSessionId;
  }
}
```

#### 2. Remover dependência instável do useEffect

Mover a lógica de registro para fora do useEffect ou usar refs para evitar re-execução:

```typescript
const registerSessionRef = useRef(registerSession);
registerSessionRef.current = registerSession;

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // ... código existente ...
      
      if (event === 'SIGNED_IN' && session?.user && !hasRegisteredSession.current) {
        hasRegisteredSession.current = true;
        setTimeout(() => {
          registerSessionRef.current(session.user).catch(console.warn);
        }, 100);
      }
    }
  );
  // ...
}, []); // Sem registerSession nas dependências
```

#### 3. Corrigir trigger de duração negativa

O trigger atual não trata corretamente o caso onde `logout_at` já tem valor. Ajustar:

```sql
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular apenas se logout_at está sendo definido agora
  IF NEW.logout_at IS NOT NULL AND 
     (OLD.logout_at IS NULL OR OLD.logout_at IS DISTINCT FROM NEW.logout_at) THEN
    NEW.session_duration_seconds := 
      EXTRACT(EPOCH FROM (NEW.logout_at - NEW.login_at))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
```

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSessionTracking.ts` | Adicionar verificação de sessão existente |
| `src/hooks/useAuth.tsx` | Remover dependência instável, usar ref |

### Impacto

- **Zero impacto** no fluxo de autenticação
- Corrige duplicação de sessões
- Evita durações negativas
- Mantém compatibilidade com sessões existentes

