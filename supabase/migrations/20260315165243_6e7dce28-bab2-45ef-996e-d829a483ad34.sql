DROP POLICY "Admin imobiliária pode criar convites" ON public.convites;

CREATE POLICY "Admin imobiliária pode criar convites"
ON public.convites
FOR INSERT
TO public
WITH CHECK (
  imobiliaria_id = get_user_imobiliaria(auth.uid())
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  AND role IN ('corretor'::app_role, 'imobiliaria_admin'::app_role)
);