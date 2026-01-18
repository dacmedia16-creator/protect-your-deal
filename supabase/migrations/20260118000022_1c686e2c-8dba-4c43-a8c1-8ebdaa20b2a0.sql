-- =============================================
-- PESQUISA PÓS-VISITA - TABELAS E POLÍTICAS
-- =============================================

-- 1) Tabela user_feature_flags (habilitar feature por usuário)
CREATE TABLE public.user_feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_feature_flags_user_feature_unique UNIQUE (user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.user_feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies for user_feature_flags
CREATE POLICY "Super admin can do everything on user_feature_flags"
  ON public.user_feature_flags
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own feature flags"
  ON public.user_feature_flags
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_feature_flags_updated_at
  BEFORE UPDATE ON public.user_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Tabela surveys (pesquisas enviadas)
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id UUID NOT NULL REFERENCES public.fichas_visita(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'responded', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT surveys_ficha_unique UNIQUE (ficha_id)
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- Policies for surveys
CREATE POLICY "Super admin can do everything on surveys"
  ON public.surveys
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Corretor can manage their own surveys"
  ON public.surveys
  FOR ALL
  USING (auth.uid() = corretor_id);

CREATE POLICY "Imobiliaria admin can view surveys from their imobiliaria"
  ON public.surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'imobiliaria_admin'
      AND ur.imobiliaria_id = surveys.imobiliaria_id
    )
  );

-- 3) Tabela survey_responses (respostas das pesquisas)
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL UNIQUE REFERENCES public.surveys(id) ON DELETE CASCADE,
  rating_location INT NOT NULL CHECK (rating_location BETWEEN 1 AND 5),
  rating_size INT NOT NULL CHECK (rating_size BETWEEN 1 AND 5),
  rating_layout INT NOT NULL CHECK (rating_layout BETWEEN 1 AND 5),
  rating_finishes INT NOT NULL CHECK (rating_finishes BETWEEN 1 AND 5),
  rating_conservation INT NOT NULL CHECK (rating_conservation BETWEEN 1 AND 5),
  rating_common_areas INT NOT NULL CHECK (rating_common_areas BETWEEN 1 AND 5),
  rating_price INT NOT NULL CHECK (rating_price BETWEEN 1 AND 5),
  liked_most TEXT,
  liked_least TEXT,
  would_buy BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Policies for survey_responses
CREATE POLICY "Super admin can do everything on survey_responses"
  ON public.survey_responses
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Corretor can view responses of their surveys"
  ON public.survey_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys s
      WHERE s.id = survey_responses.survey_id
      AND s.corretor_id = auth.uid()
    )
  );

CREATE POLICY "Imobiliaria admin can view responses from their imobiliaria"
  ON public.survey_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys s
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE s.id = survey_responses.survey_id
      AND ur.role = 'imobiliaria_admin'
      AND ur.imobiliaria_id = s.imobiliaria_id
    )
  );

-- Index for faster token lookups
CREATE INDEX idx_surveys_token ON public.surveys(token);
CREATE INDEX idx_surveys_ficha_id ON public.surveys(ficha_id);
CREATE INDEX idx_surveys_corretor_id ON public.surveys(corretor_id);
CREATE INDEX idx_user_feature_flags_user_id ON public.user_feature_flags(user_id);