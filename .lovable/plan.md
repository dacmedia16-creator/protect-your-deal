

## Plano: Limite de 7 dias no período de teste

### Contexto
Hoje, assinaturas com status `trial` são criadas sem `data_fim` e nunca expiram automaticamente. O sistema trata `trial` igual a `ativa`, dando acesso ilimitado.

### Alterações

#### 1. Definir `data_fim` ao criar trial (Edge Functions)

**`supabase/functions/registro-imobiliaria/index.ts`** e **`supabase/functions/registro-construtora/index.ts`**:
- Adicionar `data_fim` = data atual + 7 dias ao criar assinatura trial

```typescript
data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
```

#### 2. Verificar expiração do trial no frontend

**`src/hooks/useUserRole.tsx`**:
- Após carregar a assinatura, verificar se é `trial` com `data_fim` passada
- Se expirado, mudar o status local para `suspensa` (sem alterar o banco — isso será feito pelo cron)
- Expor novo campo `trialDaysLeft: number | null` no contexto

#### 3. Bloquear acesso quando trial expirar

**`src/components/ProtectedRoute.tsx`**:
- Na verificação de `requireSubscription`, tratar trial expirado como `suspensa`
- Redirecionar para `/assinatura-suspensa`

#### 4. Mostrar dias restantes nos dashboards/sidebars

**`src/pages/empresa/EmpresaDashboard.tsx`**, **`src/pages/construtora/ConstrutoraDashboard.tsx`**, **`src/components/layouts/ImobiliariaLayout.tsx`**, **`src/components/layouts/ConstutoraLayout.tsx`**:
- Onde exibe "Período de Teste", mostrar "Período de Teste (X dias restantes)"

#### 5. Atualizar página de assinatura suspensa

**`src/pages/AssinaturaSuspensa.tsx`**:
- Detectar se era trial expirado e mostrar mensagem específica: "Seu período de teste de 7 dias expirou"

#### 6. Migração: definir `data_fim` para trials existentes

Migração SQL para preencher `data_fim` em assinaturas trial existentes que não têm `data_fim`:
```sql
UPDATE assinaturas 
SET data_fim = (data_inicio + INTERVAL '7 days')::date
WHERE status = 'trial' AND data_fim IS NULL;
```

### Resultado
- Novos trials terão 7 dias de acesso
- Trials existentes receberão `data_fim` retroativa
- Usuários verão quantos dias restam
- Ao expirar, são redirecionados para a página de assinatura suspensa com CTA para contratar um plano

