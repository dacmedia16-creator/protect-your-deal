-- VIEW pública segura com apenas dados não-sensíveis
CREATE VIEW public.imobiliarias_publicas AS
SELECT 
  id,
  nome,
  codigo,
  logo_url
FROM public.imobiliarias
WHERE status = 'ativa';

-- Permitir acesso à VIEW
GRANT SELECT ON public.imobiliarias_publicas TO anon, authenticated;

-- Remover política RLS insegura que expõe todos os dados
DROP POLICY IF EXISTS "Qualquer pessoa pode validar código de imobiliária" ON public.imobiliarias;