DROP FUNCTION IF EXISTS public.get_fichas_construtora(uuid);

CREATE OR REPLACE FUNCTION public.get_fichas_construtora(p_construtora_id uuid)
RETURNS TABLE(
  id uuid, protocolo text, imovel_endereco text,
  proprietario_nome text, comprador_nome text, data_visita timestamptz,
  status text, user_id uuid, convertido_venda boolean,
  corretor_nome text, corretor_imobiliaria_nome text,
  created_at timestamptz, corretor_imobiliaria_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.is_construtora_admin(auth.uid(), p_construtora_id)
    OR public.is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT f.id, f.protocolo, f.imovel_endereco,
    f.proprietario_nome, f.comprador_nome, f.data_visita,
    f.status, f.user_id,
    COALESCE(f.convertido_venda, false),
    CASE WHEN f.user_id IS NULL THEN NULL
         ELSE COALESCE(p.nome, 'Desconhecido') END,
    i.nome,
    f.created_at,
    ur.imobiliaria_id
  FROM fichas_visita f
  LEFT JOIN profiles p ON p.user_id = f.user_id
  LEFT JOIN user_roles ur ON ur.user_id = f.user_id AND ur.imobiliaria_id IS NOT NULL
  LEFT JOIN imobiliarias i ON i.id = ur.imobiliaria_id
  WHERE f.construtora_id = p_construtora_id
  ORDER BY f.created_at DESC;
END; $$;