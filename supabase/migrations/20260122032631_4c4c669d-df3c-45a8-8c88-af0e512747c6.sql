-- 1. Criar nova policy para surveys (cobre ambos corretores)
CREATE POLICY "Ambos corretores podem ver surveys respondidas"
ON surveys FOR SELECT
TO authenticated
USING (
  status = 'responded' AND
  EXISTS (
    SELECT 1 FROM fichas_visita fv
    WHERE fv.id = surveys.ficha_id
    AND (fv.user_id = auth.uid() OR fv.corretor_parceiro_id = auth.uid())
  )
);

-- 2. Criar nova policy para survey_responses (cobre ambos corretores)
CREATE POLICY "Ambos corretores podem ver respostas de surveys respondidas"
ON survey_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM surveys s
    JOIN fichas_visita fv ON fv.id = s.ficha_id
    WHERE s.id = survey_responses.survey_id
    AND s.status = 'responded'
    AND (fv.user_id = auth.uid() OR fv.corretor_parceiro_id = auth.uid())
  )
);

-- 3. Remover policies antigas que são redundantes agora
DROP POLICY IF EXISTS "Corretor parceiro pode ver surveys respondidas" ON surveys;
DROP POLICY IF EXISTS "Corretor parceiro pode ver respostas de surveys respondidas" ON survey_responses;