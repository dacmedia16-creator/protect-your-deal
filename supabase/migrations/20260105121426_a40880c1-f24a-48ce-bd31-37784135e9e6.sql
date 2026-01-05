-- Remover política que ainda expõe todos os campos
DROP POLICY IF EXISTS "Acesso público limitado via VIEW" ON public.imobiliarias;