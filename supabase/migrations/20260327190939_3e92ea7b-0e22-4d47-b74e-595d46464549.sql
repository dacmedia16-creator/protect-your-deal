
-- Adicionar coluna construtora_id à tabela surveys
ALTER TABLE public.surveys ADD COLUMN construtora_id uuid REFERENCES public.construtoras(id);

-- Criar índice
CREATE INDEX idx_surveys_construtora_id ON public.surveys(construtora_id);

-- Popular surveys existentes com construtora_id das fichas
UPDATE public.surveys s
SET construtora_id = fv.construtora_id
FROM public.fichas_visita fv
WHERE s.ficha_id = fv.id AND fv.construtora_id IS NOT NULL;

-- RLS: construtora admin pode ver surveys da sua construtora
CREATE POLICY "Construtora admin pode ver surveys"
  ON public.surveys FOR SELECT TO authenticated
  USING (construtora_id IS NOT NULL AND is_construtora_admin(auth.uid(), construtora_id));

-- RLS: survey_responses via surveys.construtora_id
CREATE POLICY "Construtora admin pode ver respostas"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM surveys s
    WHERE s.id = survey_responses.survey_id
    AND s.construtora_id IS NOT NULL
    AND is_construtora_admin(auth.uid(), s.construtora_id)
  ));
