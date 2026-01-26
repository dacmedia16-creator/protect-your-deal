-- Recriar a view imobiliarias_publicas com SECURITY INVOKER
-- Isso garante que as permissões do usuário que consulta sejam usadas, não as do criador da view

DROP VIEW IF EXISTS public.imobiliarias_publicas;

CREATE VIEW public.imobiliarias_publicas
WITH (security_invoker=on) AS
  SELECT id, nome, codigo, logo_url
  FROM public.imobiliarias
  WHERE status = 'ativo';