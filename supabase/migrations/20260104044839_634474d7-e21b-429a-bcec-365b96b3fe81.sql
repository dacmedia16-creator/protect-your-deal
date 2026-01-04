-- Adicionar colunas para hash de integridade do documento
ALTER TABLE public.fichas_visita 
ADD COLUMN IF NOT EXISTS documento_hash TEXT,
ADD COLUMN IF NOT EXISTS documento_gerado_em TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos
COMMENT ON COLUMN public.fichas_visita.documento_hash IS 'Hash SHA-256 do PDF gerado para verificação de integridade';
COMMENT ON COLUMN public.fichas_visita.documento_gerado_em IS 'Data/hora de geração do documento PDF';