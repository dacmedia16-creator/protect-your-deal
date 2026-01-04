-- 1) Remover FK duplicada (manter apenas a original)
ALTER TABLE public.convites_parceiro 
DROP CONSTRAINT IF EXISTS fk_convites_parceiro_ficha;

-- 2) Backfill: corrigir fichas com convite aceito mas sem corretor_parceiro_id
UPDATE fichas_visita f
SET corretor_parceiro_id = c.corretor_parceiro_id,
    parte_preenchida_parceiro = c.parte_faltante
FROM convites_parceiro c
WHERE c.ficha_id = f.id
  AND c.status = 'aceito'
  AND c.corretor_parceiro_id IS NOT NULL
  AND f.corretor_parceiro_id IS NULL;

-- 3) Criar trigger para auto-vincular ficha quando convite for aceito
CREATE OR REPLACE FUNCTION public.sync_ficha_on_convite_aceito()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando status muda para 'aceito' e temos corretor_parceiro_id
  IF NEW.status = 'aceito' AND NEW.corretor_parceiro_id IS NOT NULL THEN
    UPDATE fichas_visita
    SET corretor_parceiro_id = NEW.corretor_parceiro_id,
        parte_preenchida_parceiro = NEW.parte_faltante,
        updated_at = now()
    WHERE id = NEW.ficha_id
      AND (corretor_parceiro_id IS NULL OR corretor_parceiro_id != NEW.corretor_parceiro_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_sync_ficha_on_convite_aceito ON public.convites_parceiro;

CREATE TRIGGER trigger_sync_ficha_on_convite_aceito
AFTER UPDATE ON public.convites_parceiro
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_ficha_on_convite_aceito();