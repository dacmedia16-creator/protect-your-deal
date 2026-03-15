DROP POLICY "Corretor can manage their own surveys" ON public.surveys;

CREATE POLICY "Corretor pode ver suas surveys"
ON public.surveys FOR SELECT TO authenticated
USING (auth.uid() = corretor_id);

CREATE POLICY "Corretor pode criar surveys"
ON public.surveys FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = corretor_id
  AND (
    (imobiliaria_id IS NULL AND get_user_imobiliaria(auth.uid()) IS NULL)
    OR (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  )
);

CREATE POLICY "Corretor pode atualizar suas surveys"
ON public.surveys FOR UPDATE TO authenticated
USING (auth.uid() = corretor_id)
WITH CHECK (
  auth.uid() = corretor_id
  AND (
    (imobiliaria_id IS NULL AND get_user_imobiliaria(auth.uid()) IS NULL)
    OR (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  )
);

CREATE POLICY "Corretor pode deletar suas surveys"
ON public.surveys FOR DELETE TO authenticated
USING (auth.uid() = corretor_id);