CREATE POLICY "Corretor da construtora pode ver empreendimentos"
  ON public.empreendimentos
  FOR SELECT
  TO authenticated
  USING (
    construtora_id IN (
      SELECT ur.construtora_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.construtora_id IS NOT NULL
    )
  );