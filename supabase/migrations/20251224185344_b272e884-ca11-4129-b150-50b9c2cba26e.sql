-- Adicionar colunas de segurança jurídica na tabela confirmacoes_otp
ALTER TABLE public.confirmacoes_otp 
ADD COLUMN IF NOT EXISTS aceite_legal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS aceite_nome text,
ADD COLUMN IF NOT EXISTS aceite_cpf text,
ADD COLUMN IF NOT EXISTS aceite_ip text,
ADD COLUMN IF NOT EXISTS aceite_latitude numeric,
ADD COLUMN IF NOT EXISTS aceite_longitude numeric,
ADD COLUMN IF NOT EXISTS aceite_user_agent text,
ADD COLUMN IF NOT EXISTS aceite_em timestamp with time zone;