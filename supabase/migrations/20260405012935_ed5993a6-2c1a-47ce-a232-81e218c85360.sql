DROP POLICY "Corretor parceiro pode atualizar fichas" ON public.fichas_visita;

CREATE POLICY "Corretor parceiro pode atualizar fichas"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (
  (corretor_parceiro_id = auth.uid()) AND is_user_active(auth.uid())
)
WITH CHECK (
  (corretor_parceiro_id IS NULL OR corretor_parceiro_id = auth.uid())
  AND is_user_active(auth.uid())
);