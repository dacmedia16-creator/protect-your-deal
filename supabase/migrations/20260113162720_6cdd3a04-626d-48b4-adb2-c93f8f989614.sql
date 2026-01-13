-- Adicionar user_id na tabela afiliados para permitir login
ALTER TABLE public.afiliados ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_afiliados_user_id ON public.afiliados(user_id);

-- RLS: Afiliado pode ver seus próprios dados
CREATE POLICY "Afiliado pode ver seus dados" 
ON public.afiliados 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'super_admin'
));

-- RLS: Afiliado pode ver seus cupons
CREATE POLICY "Afiliado pode ver seus cupons" 
ON public.cupons 
FOR SELECT 
USING (
  afiliado_id IN (SELECT id FROM public.afiliados WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);

-- RLS: Afiliado pode ver usos dos seus cupons
CREATE POLICY "Afiliado pode ver usos dos seus cupons" 
ON public.cupons_usos 
FOR SELECT 
USING (
  cupom_id IN (
    SELECT id FROM public.cupons 
    WHERE afiliado_id IN (SELECT id FROM public.afiliados WHERE user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);