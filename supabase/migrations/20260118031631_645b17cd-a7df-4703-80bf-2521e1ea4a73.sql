-- Adicionar campos cpf e email na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS email text;

-- Criar índice para busca por CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);