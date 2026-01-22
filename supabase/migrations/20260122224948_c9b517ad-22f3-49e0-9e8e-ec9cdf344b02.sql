-- Remover política antiga
DROP POLICY IF EXISTS "Admin e membros podem ver membros da equipe" ON equipes_membros;

-- Criar nova política que inclui líderes
CREATE POLICY "Admin, líderes e membros podem ver membros da equipe"
ON equipes_membros
FOR SELECT
TO authenticated
USING (
  -- Admin da imobiliária pode ver todos
  EXISTS (
    SELECT 1 FROM equipes e 
    WHERE e.id = equipes_membros.equipe_id 
    AND is_equipe_admin(e.imobiliaria_id)
  )
  OR
  -- Líder da equipe pode ver todos os membros da sua equipe
  EXISTS (
    SELECT 1 FROM equipes e 
    WHERE e.id = equipes_membros.equipe_id 
    AND e.lider_id = auth.uid()
    AND e.ativa = true
  )
  OR
  -- Usuário pode ver seu próprio registro
  user_id = auth.uid()
);