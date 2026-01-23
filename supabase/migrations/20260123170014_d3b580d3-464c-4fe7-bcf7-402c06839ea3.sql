-- Tabela para armazenar versões publicadas do app
CREATE TABLE public.app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca rápida da versão mais recente
CREATE INDEX idx_app_versions_published_at ON public.app_versions(published_at DESC);

-- Habilitar RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode ler versões (necessário para verificação)
CREATE POLICY "Qualquer um pode ver versões do app"
ON public.app_versions
FOR SELECT
USING (true);

-- Política: apenas super_admin pode inserir/atualizar versões
CREATE POLICY "Super admin pode gerenciar versões"
ON public.app_versions
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Comentário na tabela
COMMENT ON TABLE public.app_versions IS 'Armazena versões publicadas do app para verificação de atualização';
COMMENT ON COLUMN public.app_versions.version IS 'ID da versão (VITE_BUILD_ID)';
COMMENT ON COLUMN public.app_versions.published_at IS 'Data/hora da publicação';