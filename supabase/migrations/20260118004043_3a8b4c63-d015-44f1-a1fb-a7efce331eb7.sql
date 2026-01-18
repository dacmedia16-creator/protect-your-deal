-- Criar tabela de feature flags por imobiliária
CREATE TABLE public.imobiliaria_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliarias(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(imobiliaria_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.imobiliaria_feature_flags ENABLE ROW LEVEL SECURITY;

-- Super admins podem tudo
CREATE POLICY "Super admins full access" ON public.imobiliaria_feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Usuários da imobiliária podem ler
CREATE POLICY "Users read own imobiliaria flags" ON public.imobiliaria_feature_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND imobiliaria_id = imobiliaria_feature_flags.imobiliaria_id
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_imobiliaria_feature_flags_updated_at
  BEFORE UPDATE ON public.imobiliaria_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();