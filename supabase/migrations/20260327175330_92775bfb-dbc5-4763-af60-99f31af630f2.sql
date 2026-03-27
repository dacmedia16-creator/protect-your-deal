CREATE OR REPLACE FUNCTION public.get_fichas_construtora(p_construtora_id uuid)
RETURNS TABLE(
  id uuid, protocolo text, imovel_endereco text,
  proprietario_nome text, comprador_nome text,
  data_visita timestamptz, status text, user_id uuid,
  convertido_venda boolean, corretor_nome text,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    f.created_at
  FROM fichas_visita f
  LEFT JOIN profiles p ON p.user_id = f.user_id
  WHERE f.construtora_id = p_construtora_id
  ORDER BY f.created_at DESC;
END; $$;