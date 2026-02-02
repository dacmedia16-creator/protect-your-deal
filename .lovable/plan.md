
# Plano: Corrigir Registro de Sessões - Login do Edson Não Aparece

## Problema Identificado

### Análise dos Dados
- **Sessão do Edson no banco:** `2026-02-01 17:17:14` (ontem)
- **Hoje:** `2026-02-02` 
- **Status da sessão:** `logout_at: null` (nunca foi encerrada)
- **Nova sessão criada hoje:** NÃO

### Causa Raiz
O hook `useSessionTracking.ts` foi projetado para **reutilizar sessões ativas** para evitar duplicações. Porém, quando um usuário fecha o navegador sem fazer logout (comportamento comum), a sessão fica permanentemente "aberta" no banco.

Quando o Edson fez login hoje, o sistema:
1. Verificou se existe sessão ativa (sem `logout_at`)
2. Encontrou a sessão de ontem (01/02)
3. Reutilizou essa sessão antiga ao invés de criar uma nova
4. Resultado: parece que ele não logou hoje

Código problemático (linhas 80-95):
```typescript
const { data: activeUserSession } = await supabase
  .from('user_sessions')
  .select('id')
  .eq('user_id', user.id)
  .is('logout_at', null)  // ← Qualquer sessão "aberta" é reutilizada
  ...
if (activeUserSession) {
  return activeUserSession.id;  // ← Retorna sessão de dias atrás!
}
```

---

## Solução

### Mudança Principal
Adicionar validação de **expiração por tempo** - considerar uma sessão como "expirada" se foi criada há mais de **12 horas**, independente do `logout_at`.

### Arquivo: `src/hooks/useSessionTracking.ts`

#### 1. Criar função para verificar expiração

```typescript
// Verificar se sessão está expirada (mais de 12 horas)
const isSessionExpired = useCallback((loginAt: string): boolean => {
  const loginDate = new Date(loginAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 12; // Sessão expira após 12 horas
}, []);
```

#### 2. Atualizar lógica de verificação de sessão ativa (linhas 80-95)

Antes:
```typescript
const { data: activeUserSession } = await supabase
  .from('user_sessions')
  .select('id')
  .eq('user_id', user.id)
  .is('logout_at', null)
  .order('login_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (activeUserSession) {
  storeSessionId(activeUserSession.id);
  return activeUserSession.id;
}
```

Depois:
```typescript
const { data: activeUserSession } = await supabase
  .from('user_sessions')
  .select('id, login_at')  // ← Adicionar login_at
  .eq('user_id', user.id)
  .is('logout_at', null)
  .order('login_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (activeUserSession) {
  // Verificar se a sessão não expirou (mais de 12 horas)
  if (!isSessionExpired(activeUserSession.login_at)) {
    storeSessionId(activeUserSession.id);
    return activeUserSession.id;
  }
  
  // Sessão expirada - encerrar automaticamente antes de criar nova
  await supabase
    .from('user_sessions')
    .update({
      logout_at: new Date().toISOString(),
      logout_type: 'timeout',
    })
    .eq('id', activeUserSession.id);
}
```

#### 3. Aplicar mesma lógica na verificação do localStorage (linhas 64-78)

```typescript
if (existingSessionId) {
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id, logout_at, login_at')  // ← Adicionar login_at
    .eq('id', existingSessionId)
    .maybeSingle();
  
  // Session still active AND not expired
  if (existingSession && !existingSession.logout_at && !isSessionExpired(existingSession.login_at)) {
    sessionIdRef.current = existingSessionId;
    return existingSessionId;
  }
}
```

---

## Comportamento Após a Correção

| Cenário | Antes | Depois |
|---------|-------|--------|
| Login no mesmo dia, mesma sessão | Reutiliza | Reutiliza |
| Login após 12h+ | Reutiliza sessão antiga | Nova sessão criada |
| Fechar navegador sem logout | Sessão fica "aberta" eternamente | Auto-encerra após 12h |
| Admin vê sessões de hoje | Não vê login de hoje | Vê corretamente |

---

## Efeito Colateral Positivo

Sessões "órfãs" (sem logout) serão automaticamente encerradas com `logout_type: 'timeout'` quando o usuário fizer login novamente, limpando o histórico.

---

## Arquivos a Modificar

1. `src/hooks/useSessionTracking.ts`
   - Adicionar função `isSessionExpired`
   - Atualizar lógica nas linhas 64-78 e 80-95
