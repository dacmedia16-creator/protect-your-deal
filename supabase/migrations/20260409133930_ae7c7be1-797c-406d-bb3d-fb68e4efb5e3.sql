
CREATE TABLE public.equipe_empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  empreendimento_id uuid NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipe_id, empreendimento_id)
);

ALTER TABLE public.equipe_empreendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Construtora admin gerencia equipe_empreendimentos"
ON public.equipe_empreendimentos FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM equipes e
  WHERE e.id = equipe_empreendimentos.equipe_id
    AND e.construtora_id IS NOT NULL
    AND is_construtora_admin(auth.uid(), e.construtora_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM equipes e
  WHERE e.id = equipe_empreendimentos.equipe_id
    AND e.construtora_id IS NOT NULL
    AND is_construtora_admin(auth.uid(), e.construtora_id)
));

CREATE POLICY "Super admin full access equipe_empreendimentos"
ON public.equipe_empreendimentos FOR ALL TO public
USING (is_super_admin(auth.uid()));
