CREATE POLICY "Super admin pode atualizar fichas"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));