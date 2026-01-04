-- Adicionar foreign key de convites_parceiro para fichas_visita
ALTER TABLE public.convites_parceiro 
ADD CONSTRAINT fk_convites_parceiro_ficha 
FOREIGN KEY (ficha_id) REFERENCES public.fichas_visita(id) ON DELETE CASCADE;

-- Corrigir fichas existentes que tem convite aceito mas corretor_parceiro_id null
UPDATE fichas_visita f
SET corretor_parceiro_id = c.corretor_parceiro_id,
    parte_preenchida_parceiro = c.parte_faltante
FROM convites_parceiro c
WHERE c.ficha_id = f.id
  AND c.status = 'aceito'
  AND c.corretor_parceiro_id IS NOT NULL
  AND f.corretor_parceiro_id IS NULL;

-- Atualizar RLS policy para permitir corretor parceiro criar OTPs
DROP POLICY IF EXISTS "Corretores podem criar OTPs" ON public.confirmacoes_otp;

CREATE POLICY "Corretores podem criar OTPs" 
ON public.confirmacoes_otp 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fichas_visita
    WHERE fichas_visita.id = confirmacoes_otp.ficha_id 
      AND (
        fichas_visita.user_id = auth.uid() 
        OR fichas_visita.corretor_parceiro_id = auth.uid()
      )
  )
);

-- Atualizar RLS policy para permitir corretor parceiro ver OTPs
DROP POLICY IF EXISTS "Corretores podem ver confirmações de suas fichas" ON public.confirmacoes_otp;

CREATE POLICY "Corretores podem ver confirmações de suas fichas" 
ON public.confirmacoes_otp 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM fichas_visita
    WHERE fichas_visita.id = confirmacoes_otp.ficha_id 
      AND (
        fichas_visita.user_id = auth.uid() 
        OR fichas_visita.corretor_parceiro_id = auth.uid()
      )
  )
);