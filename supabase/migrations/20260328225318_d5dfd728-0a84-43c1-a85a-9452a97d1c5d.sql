CREATE POLICY "Construtora admin pode ver corretores de parceiras"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  imobiliaria_id IS NOT NULL
  AND role = 'corretor'::app_role
  AND EXISTS (
    SELECT 1 FROM public.construtora_imobiliarias ci
    WHERE ci.imobiliaria_id = user_roles.imobiliaria_id
    AND ci.construtora_id = get_user_construtora(auth.uid())
    AND ci.status = 'ativa'
  )
);