

## Plano: Sistema de Monitoramento de Login e Sessões

### Objetivo
Implementar um sistema para rastrear quando os usuários fazem login e quanto tempo permanecem logados no sistema.

---

### Impacto no Sistema Existente

A implementação é **não-destrutiva** e **aditiva**:

| Componente | Impacto |
|------------|---------|
| Login/Logout | Funciona normalmente - tracking em background |
| Master Login | Sem alteração - sessões identificadas como suporte |
| Performance | Mínimo - operações assíncronas |
| RLS existentes | Nenhum - tabela isolada |
| Rotas protegidas | Sem alteração |

---

### Arquitetura da Solução

```text
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   AuthProvider      │────▶│  user_sessions       │────▶│  Admin Dashboard    │
│   (useAuth.tsx)     │     │  (nova tabela)       │     │  (visualização)     │
│                     │     │                      │     │                     │
│  - onSignIn()       │     │  - user_id           │     │  - Sessões ativas   │
│  - onSignOut()      │     │  - login_at          │     │  - Tempo médio      │
│  - beforeunload     │     │  - logout_at         │     │  - Histórico        │
└─────────────────────┘     │  - session_duration  │     └─────────────────────┘
                            │  - ip_address        │
                            │  - user_agent        │
                            └──────────────────────┘
```

---

### Etapas de Implementação

#### 1. Criar tabela `user_sessions` no banco de dados

Nova tabela para armazenar dados de sessão:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Referência ao usuário |
| `imobiliaria_id` | uuid | Imobiliária do usuário (para filtros) |
| `login_at` | timestamptz | Momento do login |
| `logout_at` | timestamptz | Momento do logout (null se ativo) |
| `session_duration_seconds` | integer | Duração calculada automaticamente |
| `ip_address` | text | IP do usuário |
| `user_agent` | text | Navegador/dispositivo |
| `logout_type` | text | 'manual', 'timeout', 'browser_close' |
| `is_impersonation` | boolean | Identifica sessões de suporte |

#### 2. Criar políticas RLS

- Super admin pode ver todas as sessões
- Admin da imobiliária pode ver sessões da sua imobiliária
- Usuários comuns podem ver apenas suas próprias sessões

#### 3. Criar função de banco para calcular duração

Trigger que calcula automaticamente a duração da sessão quando `logout_at` é preenchido.

#### 4. Criar hook `useSessionTracking`

Hook dedicado para gerenciar o tracking de sessão separado da lógica de auth:
- Armazena `session_id` no localStorage
- Registra login após autenticação
- Atualiza logout via `beforeunload` usando `sendBeacon`

#### 5. Integrar no `AuthProvider`

Modificações mínimas e não-destrutivas:
- Após `signIn`: chamar função de registro (background)
- Antes `signOut`: atualizar registro (background)
- Listener `beforeunload`: capturar fechamento de aba

#### 6. Adicionar visualização no Admin Dashboard

Nova página `/admin/sessoes` com:
- Sessões ativas no momento
- Tempo médio de sessão
- Histórico de logins por usuário
- Filtros por imobiliária/período

---

### Detalhes Técnicos

#### Nova Tabela SQL

```sql
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imobiliaria_id uuid REFERENCES imobiliarias(id),
  login_at timestamptz NOT NULL DEFAULT now(),
  logout_at timestamptz,
  session_duration_seconds integer,
  ip_address text,
  user_agent text,
  logout_type text DEFAULT 'unknown',
  is_impersonation boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para calcular duração
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.logout_at IS NOT NULL AND OLD.logout_at IS NULL THEN
    NEW.session_duration_seconds := 
      EXTRACT(EPOCH FROM (NEW.logout_at - NEW.login_at))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useSessionTracking.ts` | Criar - Hook para tracking |
| `src/hooks/useAuth.tsx` | Modificar - Integrar tracking (3 linhas) |
| `src/pages/admin/AdminSessoes.tsx` | Criar - Página de visualização |
| `src/components/layouts/SuperAdminLayout.tsx` | Modificar - Adicionar link menu |

#### Proteção contra falhas

```typescript
// Exemplo de como o tracking é não-bloqueante
const registrarSessao = async (userId: string) => {
  try {
    await supabase.from('user_sessions').insert({...});
  } catch (error) {
    // Falha silenciosa - não afeta o login
    console.warn('Falha ao registrar sessão:', error);
  }
};
```

---

### Métricas Disponíveis

Após implementação, será possível consultar:

- Horários de pico de uso
- Tempo médio de sessão por usuário/imobiliária
- Frequência de logins
- Usuários mais ativos
- Sessões abandonadas (sem logout)
- Identificação de sessões de suporte (impersonation)

---

### Considerações de Segurança

- RLS habilitado para proteger dados de sessão
- Dados sensíveis (IP, user_agent) visíveis apenas para admins
- Trigger `SECURITY DEFINER` para cálculo de duração
- Sessões de impersonation claramente identificadas

