-- Atualizar função de limpeza com política de retenção de 10 anos para compliance legal
-- Regras:
-- 1. OTPs não confirmados: deletar 24h após expiração
-- 2. OTPs confirmados: manter por 10 anos para documentação imobiliária

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_unconfirmed INTEGER;
  deleted_old_confirmed INTEGER;
BEGIN
  -- 1. Deletar OTPs expirados E não confirmados (24h após expiração)
  DELETE FROM public.confirmacoes_otp 
  WHERE confirmado = false 
    AND expira_em < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_unconfirmed = ROW_COUNT;
  
  -- 2. Deletar OTPs confirmados com mais de 10 anos (após período legal)
  DELETE FROM public.confirmacoes_otp 
  WHERE confirmado = true 
    AND created_at < NOW() - INTERVAL '10 years';
  
  GET DIAGNOSTICS deleted_old_confirmed = ROW_COUNT;
  
  RAISE NOTICE 'Cleanup: % expired unconfirmed, % confirmed older than 10 years', 
    deleted_unconfirmed, deleted_old_confirmed;
END;
$function$;