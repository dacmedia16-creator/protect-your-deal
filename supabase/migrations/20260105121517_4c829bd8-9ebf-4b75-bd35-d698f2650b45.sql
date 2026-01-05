-- Remover política que expõe todos campos da tabela imobiliarias
DROP POLICY IF EXISTS "Acesso público limitado via VIEW" ON public.imobiliarias;