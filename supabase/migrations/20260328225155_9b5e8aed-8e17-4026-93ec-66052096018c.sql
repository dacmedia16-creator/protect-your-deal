CREATE POLICY "Imobiliaria parceira pode ver construtora"
ON public.construtoras
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.construtora_imobiliarias ci
    WHERE ci.construtora_id = construtoras.id
    AND ci.imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND ci.status = 'ativa'
  )
);