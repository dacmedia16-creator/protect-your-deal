-- Permitir que admin_imobiliaria atualize sua própria imobiliária
CREATE POLICY "Admin imobiliária pode atualizar sua própria imobiliária"
ON public.imobiliarias
FOR UPDATE
USING (
  id = get_user_imobiliaria(auth.uid())
  AND is_imobiliaria_admin(auth.uid(), id)
)
WITH CHECK (
  id = get_user_imobiliaria(auth.uid())
  AND is_imobiliaria_admin(auth.uid(), id)
);