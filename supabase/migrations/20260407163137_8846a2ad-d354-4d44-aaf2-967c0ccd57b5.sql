-- Add UPDATE policy for imobiliaria_admin on fichas_visita
CREATE POLICY "Admin imobiliária pode atualizar fichas da sua imobiliária"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (
  (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
)
WITH CHECK (
  (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);