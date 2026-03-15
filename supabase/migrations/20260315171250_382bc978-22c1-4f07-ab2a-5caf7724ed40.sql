
-- 1. Assinaturas: remover UPDATE aberto
DROP POLICY "Corretor pode atualizar sua assinatura" ON public.assinaturas;

-- 2. OTP: criar view segura sem codigo/token (com security_invoker para herdar RLS)
CREATE VIEW public.confirmacoes_otp_view
WITH (security_invoker = true)
AS
SELECT 
  id, ficha_id, tipo, telefone, confirmado, tentativas,
  expira_em, created_at, aceite_legal, aceite_nome, aceite_cpf,
  aceite_latitude, aceite_longitude, aceite_em, aceite_ip,
  aceite_user_agent, aceite_localizacao_tipo, lembrete_enviado_em
FROM public.confirmacoes_otp;

-- 3. Conceder SELECT na view para authenticated
GRANT SELECT ON public.confirmacoes_otp_view TO authenticated;
