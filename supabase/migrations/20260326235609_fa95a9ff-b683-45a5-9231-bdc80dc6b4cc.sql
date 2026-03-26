CREATE POLICY "Construtora admin pode ver perfis dos seus corretores"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = profiles.user_id
      AND ur.role = 'corretor'
      AND ur.construtora_id = get_user_construtora(auth.uid())
      AND get_user_construtora(auth.uid()) IS NOT NULL
  )
);