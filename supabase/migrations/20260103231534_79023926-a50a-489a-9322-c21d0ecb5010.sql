-- Corretor pode ver perfis de colegas da mesma imobiliária
CREATE POLICY "Corretor pode ver perfis da mesma imobiliaria"
ON public.profiles
FOR SELECT
USING (
  imobiliaria_id = get_user_imobiliaria(auth.uid())
  AND get_user_imobiliaria(auth.uid()) IS NOT NULL
);

-- Corretor pode ver roles de colegas da mesma imobiliária
CREATE POLICY "Corretor pode ver roles da mesma imobiliaria"
ON public.user_roles
FOR SELECT
USING (
  imobiliaria_id = get_user_imobiliaria(auth.uid())
  AND get_user_imobiliaria(auth.uid()) IS NOT NULL
);