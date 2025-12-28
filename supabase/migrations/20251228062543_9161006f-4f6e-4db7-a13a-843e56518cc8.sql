-- 1. Adicionar coluna user_id na tabela assinaturas para suportar corretores autônomos
ALTER TABLE public.assinaturas 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Tornar imobiliaria_id opcional (aceita NULL quando for assinatura de autônomo)
ALTER TABLE public.assinaturas ALTER COLUMN imobiliaria_id DROP NOT NULL;

-- 3. Constraint: deve ter OU imobiliaria_id OU user_id, não ambos vazios
ALTER TABLE public.assinaturas 
ADD CONSTRAINT chk_assinatura_owner 
CHECK (
  (imobiliaria_id IS NOT NULL AND user_id IS NULL) OR 
  (imobiliaria_id IS NULL AND user_id IS NOT NULL)
);

-- 4. Criar índice para melhorar performance de busca por user_id
CREATE INDEX idx_assinaturas_user_id ON public.assinaturas(user_id) WHERE user_id IS NOT NULL;

-- 5. Adicionar RLS policies para corretores autônomos

-- Corretor autônomo pode ver sua assinatura
CREATE POLICY "Corretor pode ver sua assinatura"
ON public.assinaturas
FOR SELECT
USING (user_id = auth.uid());

-- Corretor autônomo pode atualizar sua assinatura (para trocar de plano)
CREATE POLICY "Corretor pode atualizar sua assinatura"
ON public.assinaturas
FOR UPDATE
USING (user_id = auth.uid());

-- 6. Criar função para verificar status de assinatura de usuário individual
CREATE OR REPLACE FUNCTION public.check_user_subscription_status(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.assinaturas 
     WHERE user_id = _user_id 
     ORDER BY created_at DESC LIMIT 1),
    'sem_assinatura'
  )
$$;

-- 7. Criar função auxiliar para obter assinatura do usuário (imobiliária ou individual)
CREATE OR REPLACE FUNCTION public.get_user_subscription(_user_id uuid)
RETURNS TABLE(
  id uuid,
  status text,
  plano_id uuid,
  data_inicio date,
  data_fim date,
  proxima_cobranca date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.status,
    a.plano_id,
    a.data_inicio,
    a.data_fim,
    a.proxima_cobranca
  FROM public.assinaturas a
  WHERE a.user_id = _user_id
     OR a.imobiliaria_id = public.get_user_imobiliaria(_user_id)
  ORDER BY a.created_at DESC
  LIMIT 1
$$;