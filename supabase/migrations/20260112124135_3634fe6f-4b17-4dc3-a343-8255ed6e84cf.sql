-- Add column to track if reminder was sent
ALTER TABLE public.confirmacoes_otp 
ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NULL;