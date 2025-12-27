-- Atualizar política RLS para permitir corretores autônomos (sem imobiliária) criarem fichas
DROP POLICY IF EXISTS "Corretor pode criar fichas" ON public.fichas_visita;

CREATE POLICY "Corretor pode criar fichas" 
ON public.fichas_visita 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND (
    -- Corretor autônomo: sem imobiliária, ficha também sem imobiliária
    (get_user_imobiliaria(auth.uid()) IS NULL AND imobiliaria_id IS NULL)
    OR
    -- Corretor vinculado: imobiliária deve bater
    (get_user_imobiliaria(auth.uid()) IS NOT NULL AND imobiliaria_id = get_user_imobiliaria(auth.uid()))
  )
);