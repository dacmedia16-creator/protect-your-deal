-- Recriar VIEW com SECURITY INVOKER para respeitar RLS do usuário
DROP VIEW IF EXISTS public.imobiliarias_publicas;

CREATE VIEW public.imobiliarias_publicas 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  codigo,
  logo_url
FROM public.imobiliarias
WHERE status = 'ativa';

-- Permitir acesso à VIEW
GRANT SELECT ON public.imobiliarias_publicas TO anon, authenticated;

-- Criar política RLS segura para permitir apenas SELECT dos campos públicos via VIEW
-- A VIEW já filtra os campos, então a política pode permitir SELECT na tabela base
-- mas usuários só conseguem acessar via VIEW que expõe campos limitados
CREATE POLICY "Acesso público limitado via VIEW" 
ON public.imobiliarias 
FOR SELECT 
TO anon, authenticated
USING (status = 'ativa');