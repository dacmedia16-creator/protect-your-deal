-- 1. Criar função auxiliar com SECURITY DEFINER para verificar se usuário pertence à imobiliária
CREATE OR REPLACE FUNCTION check_equipe_access(equipe_imobiliaria_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = equipe_imobiliaria_id
  );
$$;

-- 2. Criar função para verificar se é admin da imobiliária
CREATE OR REPLACE FUNCTION is_equipe_admin(equipe_imobiliaria_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = equipe_imobiliaria_id
      AND ur.role = ANY (ARRAY['imobiliaria_admin'::app_role, 'super_admin'::app_role])
  );
$$;

-- 3. Atualizar policy de SELECT para equipes (sem recursão)
DROP POLICY IF EXISTS "Admin da imobiliaria pode ver equipes" ON public.equipes;

CREATE POLICY "Admin da imobiliaria pode ver equipes"
ON public.equipes
FOR SELECT
USING (
  check_equipe_access(imobiliaria_id)
);

-- 4. Atualizar policies de equipes_membros para usar função auxiliar
DROP POLICY IF EXISTS "Admin e membros podem ver membros da equipe" ON public.equipes_membros;

CREATE POLICY "Admin e membros podem ver membros da equipe"
ON public.equipes_membros
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM equipes e
    WHERE e.id = equipes_membros.equipe_id
      AND is_equipe_admin(e.imobiliaria_id)
  )
  OR user_id = auth.uid()
);