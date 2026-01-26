

## Plano: Limpar Sessões Duplicadas do Banco de Dados

### Análise dos Dados Atuais

| Usuário | Total Sessões | Para Deletar | Sessões Ativas |
|---------|---------------|--------------|----------------|
| 726c5b8a... | 7 | 6 | 5 |
| 48d00459... | 2 | 1 | 1 |
| 1c342604... | 1 | 0 | 0 |
| fd13d8a0... | 1 | 0 | 0 |

**Problemas identificados:**
- Sessões duplicadas criadas em segundos de diferença
- Durações negativas (-90s, -105s, -107s, -109s)
- Múltiplas sessões "ativas" (sem logout_at) para o mesmo usuário

### Solução

Executar uma migração SQL que:

1. **Deleta sessões duplicadas** - mantém apenas a mais recente por usuário
2. **Corrige durações negativas** - zera durações inválidas

### Query de Limpeza

```sql
-- 1. Deletar sessões duplicadas (manter apenas a mais recente por usuário)
DELETE FROM user_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_sessions
  ORDER BY user_id, login_at DESC
);

-- 2. Corrigir durações negativas existentes
UPDATE user_sessions
SET session_duration_seconds = NULL
WHERE session_duration_seconds < 0;
```

### Resultado Esperado

- **7 sessões deletadas** (duplicadas)
- **4 sessões mantidas** (uma por usuário, a mais recente)
- **0 durações negativas** restantes

### Impacto

- **Zero impacto** em usuários ativos (sessão mais recente é preservada)
- Dados históricos de sessões duplicadas serão perdidos
- localStorage dos usuários pode ter IDs de sessões deletadas (será criada nova no próximo login)

