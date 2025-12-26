-- Remover políticas existentes (RESTRICTIVE)
DROP POLICY IF EXISTS "Usuário pode ver seu próprio role" ON user_roles;
DROP POLICY IF EXISTS "Super admin pode ver todos roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin pode gerenciar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin imobiliária pode ver roles da sua imobiliária" ON user_roles;
DROP POLICY IF EXISTS "Admin imobiliária pode criar roles na sua imobiliária" ON user_roles;
DROP POLICY IF EXISTS "Admin imobiliária pode deletar roles de corretores" ON user_roles;

-- Recriar como PERMISSIVE (padrão)
CREATE POLICY "Usuário pode ver seu próprio role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admin pode ver todos roles" ON user_roles
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode gerenciar roles" ON user_roles
  FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliária pode ver roles da sua imobiliária" ON user_roles
  FOR SELECT USING (
    imobiliaria_id = get_user_imobiliaria(auth.uid()) 
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Admin imobiliária pode criar roles na sua imobiliária" ON user_roles
  FOR INSERT WITH CHECK (
    imobiliaria_id = get_user_imobiliaria(auth.uid()) 
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id) 
    AND role = 'corretor'
  );

CREATE POLICY "Admin imobiliária pode deletar roles de corretores" ON user_roles
  FOR DELETE USING (
    imobiliaria_id = get_user_imobiliaria(auth.uid()) 
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id) 
    AND role = 'corretor'
  );