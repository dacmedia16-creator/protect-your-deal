-- Allow partner broker to view surveys when responded
CREATE POLICY "Corretor parceiro pode ver surveys respondidas"
ON surveys FOR SELECT
TO authenticated
USING (
  status = 'responded' AND
  EXISTS (
    SELECT 1 FROM fichas_visita fv
    WHERE fv.id = surveys.ficha_id
    AND fv.corretor_parceiro_id = auth.uid()
  )
);

-- Allow partner broker to view survey responses when survey is responded
CREATE POLICY "Corretor parceiro pode ver respostas de surveys respondidas"
ON survey_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM surveys s
    JOIN fichas_visita fv ON fv.id = s.ficha_id
    WHERE s.id = survey_responses.survey_id
    AND s.status = 'responded'
    AND fv.corretor_parceiro_id = auth.uid()
  )
);