
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Corretor pode criar fichas" ON public.fichas_visita;

-- Recreate with support for construtora_id when imobiliaria is partner
CREATE POLICY "Corretor pode criar fichas"
ON public.fichas_visita
FOR INSERT
TO authenticated
WITH CHECK (
  is_user_active(auth.uid())
  AND user_id = auth.uid()
  AND (
    -- Case 1: Corretor autônomo (sem imobiliária)
    (get_user_imobiliaria(auth.uid()) IS NULL AND imobiliaria_id IS NULL AND construtora_id IS NULL)
    -- Case 2: Corretor de imobiliária (sem construtora)
    OR (get_user_imobiliaria(auth.uid()) IS NOT NULL AND imobiliaria_id = get_user_imobiliaria(auth.uid()) AND construtora_id IS NULL)
    -- Case 3: Corretor de construtora nativa
    OR (get_user_construtora(auth.uid()) IS NOT NULL AND construtora_id = get_user_construtora(auth.uid()))
    -- Case 4: Corretor de imobiliária parceira de construtora
    OR (
      get_user_imobiliaria(auth.uid()) IS NOT NULL
      AND imobiliaria_id = get_user_imobiliaria(auth.uid())
      AND construtora_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.construtora_imobiliarias ci
        WHERE ci.construtora_id = fichas_visita.construtora_id
          AND ci.imobiliaria_id = get_user_imobiliaria(auth.uid())
          AND ci.status = 'ativa'
      )
    )
  )
);
