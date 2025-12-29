-- Política para corretor ver convites recebidos pelo telefone (normalizado)
CREATE POLICY "Corretor pode ver convites recebidos pelo telefone"
ON convites_parceiro
FOR SELECT
USING (
  corretor_parceiro_telefone IN (
    SELECT REGEXP_REPLACE(telefone, '[^0-9]', '', 'g') FROM profiles WHERE user_id = auth.uid()
  )
  OR corretor_parceiro_id = auth.uid()
);

-- Política para corretor aceitar convite (atualizar)
CREATE POLICY "Corretor pode aceitar convites recebidos"
ON convites_parceiro
FOR UPDATE
USING (
  corretor_parceiro_telefone IN (
    SELECT REGEXP_REPLACE(telefone, '[^0-9]', '', 'g') FROM profiles WHERE user_id = auth.uid()
  )
  OR corretor_parceiro_id = auth.uid()
);