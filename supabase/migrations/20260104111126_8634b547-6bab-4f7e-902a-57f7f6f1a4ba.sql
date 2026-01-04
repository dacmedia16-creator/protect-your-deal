-- Corrigir função de limpeza para preservar OTPs confirmados
-- Os registros confirmados contêm dados legais importantes (IP, geolocalização, aceite)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas deletar OTPs expirados E não confirmados
  -- OTPs confirmados são preservados para fins legais e geração de PDF
  DELETE FROM public.confirmacoes_otp 
  WHERE expira_em < NOW() - INTERVAL '24 hours'
    AND confirmado = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired and unconfirmed OTP records', deleted_count;
END;
$function$;