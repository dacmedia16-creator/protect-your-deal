

## Corrigir 2 vulnerabilidades críticas de RLS

### 1. Tabela `email_logs` — INSERT público aberto

**Problema**: A policy "Sistema pode inserir logs" usa `FOR INSERT WITH CHECK (true)` na role `public`, permitindo que qualquer usuário (mesmo não autenticado) injete registros arbitrários.

**Correção**: Dropar a policy existente e criar uma nova restrita a `service_role`.

```sql
DROP POLICY "Sistema pode inserir logs" ON public.email_logs;

CREATE POLICY "Service role pode inserir logs"
  ON public.email_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**Impacto**: A edge function `send-email` já usa `SUPABASE_SERVICE_ROLE_KEY` para criar o client, então continuará funcionando normalmente.

### 2. View `confirmacoes_otp_view` — análise

**Status atual**: A view já tem `security_invoker = true` e já exclui os campos `codigo` e `token`. O RLS da tabela subjacente (`confirmacoes_otp`) já filtra por `fichas_visita.user_id = auth.uid()` ou `corretor_parceiro_id = auth.uid()`.

Os campos PII restantes (`aceite_cpf`, `aceite_ip`, `telefone`, `aceite_latitude/longitude`) são necessários para exibir os dados de aceite legal na página DetalhesFicha e já estão protegidos pelo RLS da tabela base.

**Melhoria**: Remover o campo `telefone` da view, pois essa informação já está disponível via `fichas_visita` e não precisa ser duplicada na view de confirmações.

```sql
DROP VIEW public.confirmacoes_otp_view;

CREATE VIEW public.confirmacoes_otp_view
WITH (security_invoker = true) AS
SELECT 
  id, ficha_id, tipo, confirmado, tentativas,
  expira_em, created_at, aceite_legal, aceite_nome, aceite_cpf,
  aceite_latitude, aceite_longitude, aceite_em, aceite_ip,
  aceite_user_agent, aceite_localizacao_tipo, lembrete_enviado_em
FROM public.confirmacoes_otp;

GRANT SELECT ON public.confirmacoes_otp_view TO authenticated;
```

### Resumo

| Mudança | Arquivo |
|---------|---------|
| Migration SQL (ambas correções) | Nova migration |
| Verificar se `telefone` é usado da view no frontend | Nenhuma mudança necessária (campo não é usado) |

