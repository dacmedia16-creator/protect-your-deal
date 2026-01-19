-- Adicionar coluna para armazenar plano aguardando confirmação de pagamento
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS plano_pendente_id uuid REFERENCES public.planos(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.assinaturas.plano_pendente_id IS 'Plano aguardando confirmação de pagamento para upgrade/downgrade';