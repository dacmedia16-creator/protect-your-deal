-- Tabela de equipes
CREATE TABLE public.equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imobiliaria_id UUID NOT NULL REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#3B82F6',
  lider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de membros das equipes
CREATE TABLE public.equipes_membros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cargo TEXT DEFAULT 'corretor',
  entrou_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipe_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_equipes_imobiliaria ON public.equipes(imobiliaria_id);
CREATE INDEX idx_equipes_membros_equipe ON public.equipes_membros(equipe_id);
CREATE INDEX idx_equipes_membros_user ON public.equipes_membros(user_id);

-- Enable RLS
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes_membros ENABLE ROW LEVEL SECURITY;

-- RLS Policies para equipes
CREATE POLICY "Admin da imobiliaria pode ver equipes"
  ON public.equipes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = equipes.imobiliaria_id
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.equipes_membros em
      WHERE em.equipe_id = equipes.id
      AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin da imobiliaria pode criar equipes"
  ON public.equipes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = imobiliaria_id
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
  );

CREATE POLICY "Admin da imobiliaria pode atualizar equipes"
  ON public.equipes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = equipes.imobiliaria_id
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
  );

CREATE POLICY "Admin da imobiliaria pode deletar equipes"
  ON public.equipes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = equipes.imobiliaria_id
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
  );

-- RLS Policies para equipes_membros
CREATE POLICY "Admin e membros podem ver membros da equipe"
  ON public.equipes_membros
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.equipes e
      JOIN public.user_roles ur ON ur.imobiliaria_id = e.imobiliaria_id
      WHERE e.id = equipes_membros.equipe_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.equipes_membros em2
      WHERE em2.equipe_id = equipes_membros.equipe_id
      AND em2.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin pode adicionar membros"
  ON public.equipes_membros
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.equipes e
      JOIN public.user_roles ur ON ur.imobiliaria_id = e.imobiliaria_id
      WHERE e.id = equipe_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
  );

CREATE POLICY "Admin pode remover membros"
  ON public.equipes_membros
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.equipes e
      JOIN public.user_roles ur ON ur.imobiliaria_id = e.imobiliaria_id
      WHERE e.id = equipes_membros.equipe_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
  );

CREATE POLICY "Admin pode atualizar membros"
  ON public.equipes_membros
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.equipes e
      JOIN public.user_roles ur ON ur.imobiliaria_id = e.imobiliaria_id
      WHERE e.id = equipes_membros.equipe_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('imobiliaria_admin', 'super_admin')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_equipes_updated_at
  BEFORE UPDATE ON public.equipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();