CREATE POLICY "Imobiliaria admin pode aceitar ou recusar parcerias"
  ON public.construtora_imobiliarias
  FOR UPDATE
  TO authenticated
  USING (
    imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  )
  WITH CHECK (
    imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );