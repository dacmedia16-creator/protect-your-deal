-- Função para buscar equipes de uma imobiliária (sem auth)
CREATE OR REPLACE FUNCTION public.get_equipes_by_imobiliaria(imob_id uuid)
RETURNS TABLE (id uuid, nome text, cor text, descricao text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id, e.nome, e.cor, e.descricao
  FROM public.equipes e
  WHERE e.imobiliaria_id = imob_id 
    AND e.ativa = true
  ORDER BY e.nome;
$$;

-- Função para adicionar membro à equipe (sem auth, usando user_id explícito)
CREATE OR REPLACE FUNCTION public.add_membro_to_equipe(
  p_equipe_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.equipes_membros (equipe_id, user_id, cargo)
  VALUES (p_equipe_id, p_user_id, 'corretor')
  ON CONFLICT (equipe_id, user_id) DO NOTHING;
END;
$$;