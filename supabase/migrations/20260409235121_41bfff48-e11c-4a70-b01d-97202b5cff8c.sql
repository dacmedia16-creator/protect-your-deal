CREATE POLICY "Users can read own construtora flags"
ON public.construtora_feature_flags
FOR SELECT
TO authenticated
USING (
  construtora_id IS NOT NULL
  AND construtora_id = public.get_user_construtora(auth.uid())
);