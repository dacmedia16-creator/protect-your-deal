-- Add sales conversion tracking fields to fichas_visita
ALTER TABLE public.fichas_visita 
ADD COLUMN IF NOT EXISTS convertido_venda BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS valor_venda NUMERIC,
ADD COLUMN IF NOT EXISTS convertido_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS convertido_por UUID;

-- Create index for faster queries on converted sales
CREATE INDEX IF NOT EXISTS idx_fichas_convertido_venda ON public.fichas_visita(convertido_venda) WHERE convertido_venda = true;

-- RLS policy: Líder pode atualizar fichas da sua equipe (for marking sales)
CREATE POLICY "Líder pode atualizar fichas da equipe" 
ON public.fichas_visita 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.equipes e
    JOIN public.equipes_membros em ON em.equipe_id = e.id
    WHERE e.lider_id = auth.uid() 
      AND e.ativa = true 
      AND em.user_id = fichas_visita.user_id
  )
  AND is_user_active(auth.uid())
);