CREATE OR REPLACE FUNCTION public.get_cupom_by_afiliado(afiliado_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT codigo
  FROM public.cupons
  WHERE afiliado_id = afiliado_uuid
    AND ativo = true
  ORDER BY valor_desconto ASC, created_at ASC
  LIMIT 1;
$$;