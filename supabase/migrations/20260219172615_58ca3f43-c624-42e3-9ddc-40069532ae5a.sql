
CREATE POLICY "Super admin pode atualizar qualquer perfil"
  ON public.profiles
  FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliaria pode atualizar perfis da sua imobiliaria"
  ON public.profiles
  FOR UPDATE
  USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );
