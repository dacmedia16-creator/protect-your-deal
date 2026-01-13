-- Adicionar colunas para vincular afiliado permanentemente à assinatura
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES public.afiliados(id),
ADD COLUMN IF NOT EXISTS cupom_id UUID REFERENCES public.cupons(id),
ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5,2) DEFAULT 0;

-- Índice para busca por afiliado
CREATE INDEX IF NOT EXISTS idx_assinaturas_afiliado_id ON public.assinaturas(afiliado_id);

-- Comentários para documentação
COMMENT ON COLUMN public.assinaturas.afiliado_id IS 'Afiliado que indicou este cliente (para comissões recorrentes)';
COMMENT ON COLUMN public.assinaturas.cupom_id IS 'Cupom usado no registro (para rastreamento)';
COMMENT ON COLUMN public.assinaturas.comissao_percentual IS 'Percentual de comissão aplicado em cada pagamento';