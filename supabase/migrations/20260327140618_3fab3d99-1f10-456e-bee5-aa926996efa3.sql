CREATE POLICY "Construtora admin pode buscar imobiliárias ativas"
  ON public.imobiliarias
  FOR SELECT
  TO authenticated
  USING (
    status = 'ativo'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'construtora_admin'
    )
  );