-- Função SECURITY DEFINER para obter o ID do afiliado do usuário logado
-- Evita recursão RLS ao consultar a tabela afiliados
CREATE OR REPLACE FUNCTION public.get_afiliado_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.afiliados WHERE user_id = _user_id LIMIT 1
$$;

-- Recriar policy sem recursão
DROP POLICY IF EXISTS "Afiliado pode ver seus dados" ON public.afiliados;

CREATE POLICY "Afiliado pode ver seus dados" 
ON public.afiliados 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR indicado_por = public.get_afiliado_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);