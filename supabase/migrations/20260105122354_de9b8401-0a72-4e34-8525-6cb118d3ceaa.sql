-- Corrigir VIEW imobiliarias_publicas com filtro correto de status
DROP VIEW IF EXISTS public.imobiliarias_publicas;

CREATE VIEW public.imobiliarias_publicas 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  codigo,
  logo_url
FROM public.imobiliarias
WHERE status = 'ativo';

-- Garantir permissões de leitura
GRANT SELECT ON public.imobiliarias_publicas TO anon, authenticated;