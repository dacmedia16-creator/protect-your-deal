-- =============================================
-- ATUALIZAR RLS POLICIES PARA VERIFICAR USUÁRIO ATIVO
-- =============================================

-- TABELA: fichas_visita
-- =============================================

-- Política INSERT - Corretor
DROP POLICY IF EXISTS "Corretor pode criar fichas" ON fichas_visita;
CREATE POLICY "Corretor pode criar fichas" ON fichas_visita
FOR INSERT TO authenticated
WITH CHECK (
  is_user_active(auth.uid()) AND
  user_id = auth.uid() AND 
  ((get_user_imobiliaria(auth.uid()) IS NULL AND imobiliaria_id IS NULL) OR 
   (get_user_imobiliaria(auth.uid()) IS NOT NULL AND imobiliaria_id = get_user_imobiliaria(auth.uid())))
);

-- Política UPDATE - Corretor (próprias fichas)
DROP POLICY IF EXISTS "Corretor pode atualizar suas fichas" ON fichas_visita;
CREATE POLICY "Corretor pode atualizar suas fichas" ON fichas_visita
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND is_user_active(auth.uid()));

-- Política UPDATE - Corretor Parceiro
DROP POLICY IF EXISTS "Corretor parceiro pode atualizar fichas" ON fichas_visita;
CREATE POLICY "Corretor parceiro pode atualizar fichas" ON fichas_visita
FOR UPDATE TO authenticated
USING (corretor_parceiro_id = auth.uid() AND is_user_active(auth.uid()));

-- TABELA: clientes
-- =============================================

-- Política INSERT - Corretor
DROP POLICY IF EXISTS "Corretor pode criar clientes" ON clientes;
CREATE POLICY "Corretor pode criar clientes" ON clientes
FOR INSERT TO authenticated
WITH CHECK (
  is_user_active(auth.uid()) AND
  user_id = auth.uid() AND 
  imobiliaria_id = get_user_imobiliaria(auth.uid())
);

-- Política INSERT - Admin Imobiliária
DROP POLICY IF EXISTS "Admin imobiliária pode criar clientes da sua imobiliária" ON clientes;
CREATE POLICY "Admin imobiliária pode criar clientes da sua imobiliária" ON clientes
FOR INSERT TO authenticated
WITH CHECK (
  is_user_active(auth.uid()) AND
  imobiliaria_id = get_user_imobiliaria(auth.uid()) AND 
  is_imobiliaria_admin(auth.uid(), imobiliaria_id) AND 
  user_id = auth.uid()
);

-- Política UPDATE - Corretor
DROP POLICY IF EXISTS "Corretor pode atualizar seus clientes" ON clientes;
CREATE POLICY "Corretor pode atualizar seus clientes" ON clientes
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND is_user_active(auth.uid()));

-- TABELA: imoveis
-- =============================================

-- Política INSERT - Corretor
DROP POLICY IF EXISTS "Corretor pode criar imóveis" ON imoveis;
CREATE POLICY "Corretor pode criar imóveis" ON imoveis
FOR INSERT TO authenticated
WITH CHECK (
  is_user_active(auth.uid()) AND
  user_id = auth.uid() AND 
  imobiliaria_id = get_user_imobiliaria(auth.uid())
);

-- Política UPDATE - Corretor
DROP POLICY IF EXISTS "Corretor pode atualizar seus imóveis" ON imoveis;
CREATE POLICY "Corretor pode atualizar seus imóveis" ON imoveis
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND is_user_active(auth.uid()));