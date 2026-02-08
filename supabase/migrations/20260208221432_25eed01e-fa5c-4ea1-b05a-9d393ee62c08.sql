
CREATE OR REPLACE FUNCTION public.get_fichas_empresa(p_imobiliaria_id uuid)
RETURNS TABLE(
  id uuid,
  protocolo text,
  imovel_endereco text,
  proprietario_nome text,
  comprador_nome text,
  data_visita timestamptz,
  status text,
  user_id uuid,
  convertido_venda boolean,
  corretor_nome text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar permissão: deve ser admin da imobiliária ou super_admin
  IF NOT (
    public.is_imobiliaria_admin(auth.uid(), p_imobiliaria_id) 
    OR public.is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão para acessar registros desta imobiliária';
  END IF;

  RETURN QUERY
  SELECT 
    f.id,
    f.protocolo,
    f.imovel_endereco,
    f.proprietario_nome,
    f.comprador_nome,
    f.data_visita,
    f.status,
    f.user_id,
    COALESCE(f.convertido_venda, false) AS convertido_venda,
    CASE 
      WHEN f.user_id IS NULL THEN NULL
      ELSE COALESCE(p.nome, 'Desconhecido')
    END AS corretor_nome,
    f.created_at
  FROM public.fichas_visita f
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  WHERE f.imobiliaria_id = p_imobiliaria_id
  ORDER BY f.created_at DESC;
END;
$$;
