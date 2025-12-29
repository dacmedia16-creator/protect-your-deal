-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função para limpar OTPs expirados (mais de 24 horas)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.confirmacoes_otp 
  WHERE expira_em < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired OTP records', deleted_count;
END;
$$;

-- Agendar job para rodar diariamente às 3h UTC
SELECT cron.schedule(
  'cleanup-expired-otps',
  '0 3 * * *',
  $$SELECT public.cleanup_expired_otps()$$
);