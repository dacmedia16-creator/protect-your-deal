
-- 1. Create indexes on user_roles for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_construtora ON public.user_roles(user_id, construtora_id) WHERE construtora_id IS NOT NULL;

-- 2. Fix assinaturas policy: eliminate double function call
DROP POLICY IF EXISTS "Construtora admin pode ver sua assinatura" ON public.assinaturas;
CREATE POLICY "Construtora admin pode ver sua assinatura"
  ON public.assinaturas
  FOR SELECT
  TO authenticated
  USING (construtora_id IS NOT NULL AND construtora_id = get_user_construtora(auth.uid()));

-- 3. Fix fichas_visita policy: eliminate double function call
DROP POLICY IF EXISTS "Construtora admin pode ver fichas dos seus empreendimentos" ON public.fichas_visita;
CREATE POLICY "Construtora admin pode ver fichas dos seus empreendimentos"
  ON public.fichas_visita
  FOR SELECT
  TO authenticated
  USING (construtora_id IS NOT NULL AND construtora_id = get_user_construtora(auth.uid()));

-- 4. Fix user_roles policy: eliminate double function call
DROP POLICY IF EXISTS "Construtora admin pode ver roles da sua construtora" ON public.user_roles;
CREATE POLICY "Construtora admin pode ver roles da sua construtora"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (construtora_id IS NOT NULL AND construtora_id = get_user_construtora(auth.uid()));

-- 5. Fix user_roles INSERT policy: eliminate double function call
DROP POLICY IF EXISTS "Construtora admin pode criar roles na sua construtora" ON public.user_roles;
CREATE POLICY "Construtora admin pode criar roles na sua construtora"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (construtora_id IS NOT NULL AND construtora_id = get_user_construtora(auth.uid()) AND is_construtora_admin(auth.uid(), construtora_id) AND role = 'corretor'::app_role);
