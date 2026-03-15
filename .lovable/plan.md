

## Corrigir 2 vulnerabilidades críticas

### 1. Remover UPDATE aberto em `assinaturas`

**Problema:** A política "Corretor pode atualizar sua assinatura" (`user_id = auth.uid()`) permite que um corretor autônomo altere status, plano, datas da própria assinatura via client-side.

**Correção:** Dropar essa política. Todas as atualizações de assinatura já passam por edge functions (`asaas-webhook`, `asaas-payment-link`, `asaas-create-subscription`) que usam `service_role`. O frontend (useUserRole, CorretorAssinatura) só faz SELECT.

```sql
DROP POLICY "Corretor pode atualizar sua assinatura" ON public.assinaturas;
```

### 2. Proteger códigos OTP em `confirmacoes_otp`

**Problema:** A política SELECT permite que corretores vejam o campo `codigo` (OTP em texto plano) de suas fichas. Um corretor poderia confirmar visitas sem o consentimento real do proprietário/comprador.

**Correção:** Como RLS não filtra colunas, vamos criar uma **view** `confirmacoes_otp_view` que exclui `codigo` e `token`, e atualizar o frontend para usá-la. Edge functions continuam acessando a tabela original via `service_role`.

**Migration SQL:**
```sql
-- 1. Assinaturas: remover UPDATE aberto
DROP POLICY "Corretor pode atualizar sua assinatura" ON public.assinaturas;

-- 2. OTP: criar view segura sem codigo/token
CREATE VIEW public.confirmacoes_otp_view AS
SELECT 
  id, ficha_id, tipo, telefone, confirmado, tentativas,
  expira_em, created_at, aceite_legal, aceite_nome, aceite_cpf,
  aceite_latitude, aceite_longitude, aceite_em, aceite_ip,
  aceite_user_agent, aceite_localizacao_tipo, lembrete_enviado_em
FROM public.confirmacoes_otp;

-- 3. Revogar SELECT direto de corretores na tabela original
DROP POLICY "Corretores podem ver confirmações de suas fichas" ON public.confirmacoes_otp;

-- 4. Manter INSERT para corretores (não expõe dados)
-- (já existe, não precisa alterar)

-- 5. Conceder SELECT na view para authenticated
GRANT SELECT ON public.confirmacoes_otp_view TO authenticated;
```

**Frontend (1 arquivo):** `src/pages/DetalhesFicha.tsx`
- Linha 256: trocar `.from('confirmacoes_otp')` por `.from('confirmacoes_otp_view')`
- A view retorna os mesmos campos usados no frontend (aceite_legal, aceite_nome, aceite_cpf, etc.) exceto `codigo` e `token` que não são utilizados na renderização.

**Nota:** A view herda o acesso via `authenticated` role. Para filtrar por ficha do usuário, adicionaremos segurança na view com `security_invoker = true` (Postgres 15+) combinado com uma policy na view, ou usaremos uma RLS-enabled view. Como alternativa mais simples, adicionaremos a filtragem diretamente na view usando `auth.uid()`.

**Escopo:**
- 1 migration SQL (drop policy + create view + grant)
- 1 arquivo frontend editado (DetalhesFicha.tsx — 1 linha)
- Nenhuma mudança em edge functions (usam service_role)

