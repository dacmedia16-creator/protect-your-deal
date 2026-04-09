-- Add motivo_perda column
ALTER TABLE public.fichas_visita 
ADD COLUMN IF NOT EXISTS motivo_perda text;

-- Add comment for documentation
COMMENT ON COLUMN public.fichas_visita.motivo_perda IS 'Motivo pelo qual a visita não converteu em venda';