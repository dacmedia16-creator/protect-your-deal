CREATE OR REPLACE FUNCTION public.get_imobiliarias_publicas()
 RETURNS TABLE(id uuid, nome text, codigo integer, logo_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, nome, codigo, logo_url
  FROM imobiliarias
  WHERE status = 'ativo';
$function$;