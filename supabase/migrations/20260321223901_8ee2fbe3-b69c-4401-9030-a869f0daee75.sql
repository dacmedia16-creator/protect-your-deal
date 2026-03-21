-- 1. Fix email_logs: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.email_logs;

CREATE POLICY "Service role pode inserir logs"
  ON public.email_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. Recreate confirmacoes_otp_view without telefone field
DROP VIEW IF EXISTS public.confirmacoes_otp_view;

CREATE VIEW public.confirmacoes_otp_view
WITH (security_invoker = true) AS
SELECT 
  id, ficha_id, tipo, confirmado, tentativas,
  expira_em, created_at, aceite_legal, aceite_nome, aceite_cpf,
  aceite_latitude, aceite_longitude, aceite_em, aceite_ip,
  aceite_user_agent, aceite_localizacao_tipo, lembrete_enviado_em
FROM public.confirmacoes_otp;

GRANT SELECT ON public.confirmacoes_otp_view TO authenticated;