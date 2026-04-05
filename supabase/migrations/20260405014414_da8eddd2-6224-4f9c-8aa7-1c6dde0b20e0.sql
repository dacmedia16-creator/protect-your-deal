-- Standardize all UPDATE policies on fichas_visita with explicit WITH CHECK

-- 1. Corretor pode atualizar suas fichas (owner keeps ownership)
DROP POLICY "Corretor pode atualizar suas fichas" ON public.fichas_visita;
CREATE POLICY "Corretor pode atualizar suas fichas"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) AND is_user_active(auth.uid())
)
WITH CHECK (
  (user_id = auth.uid()) AND is_user_active(auth.uid())
);

-- 2. Líder pode atualizar fichas da equipe (leader keeps team scope)
DROP POLICY "Líder pode atualizar fichas da equipe" ON public.fichas_visita;
CREATE POLICY "Líder pode atualizar fichas da equipe"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM equipes e
    JOIN equipes_membros em ON em.equipe_id = e.id
    WHERE e.lider_id = auth.uid() AND e.ativa = true AND em.user_id = fichas_visita.user_id
  )) AND is_user_active(auth.uid())
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM equipes e
    JOIN equipes_membros em ON em.equipe_id = e.id
    WHERE e.lider_id = auth.uid() AND e.ativa = true AND em.user_id = fichas_visita.user_id
  )) AND is_user_active(auth.uid())
);

-- 3. Super admin pode atualizar fichas (full access)
DROP POLICY "Super admin pode atualizar fichas" ON public.fichas_visita;
CREATE POLICY "Super admin pode atualizar fichas"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
)
WITH CHECK (
  is_super_admin(auth.uid())
);