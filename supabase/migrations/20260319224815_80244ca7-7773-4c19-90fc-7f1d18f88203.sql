DROP POLICY IF EXISTS "Afiliado pode ver seus dados" ON public.afiliados;

CREATE POLICY "Afiliado pode ver seus dados" 
ON public.afiliados 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR indicado_por IN (SELECT id FROM public.afiliados WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);