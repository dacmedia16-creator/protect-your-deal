
CREATE OR REPLACE FUNCTION public.get_fichas_admin()
RETURNS TABLE(
  id uuid,
  protocolo text,
  imovel_endereco text,
  proprietario_nome text,
  comprador_nome text,
  data_visita timestamp with time zone,
  status text,
  user_id uuid,
  imobiliaria_id uuid,
  backup_gerado_em timestamp with time zone,
  convertido_venda boolean,
  corretor_nome text,
  imobiliaria_nome text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar permissão: deve ser super_admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para acessar registros administrativos';
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
    f.imobiliaria_id,
    f.backup_gerado_em,
    COALESCE(f.convertido_venda, false) AS convertido_venda,
    CASE 
      WHEN f.user_id IS NULL THEN NULL
      ELSE COALESCE(p.nome, 'Desconhecido')
    END AS corretor_nome,
    i.nome AS imobiliaria_nome
  FROM public.fichas_visita f
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  LEFT JOIN public.imobiliarias i ON i.id = f.imobiliaria_id
  ORDER BY f.created_at DESC;
END;
$$;
