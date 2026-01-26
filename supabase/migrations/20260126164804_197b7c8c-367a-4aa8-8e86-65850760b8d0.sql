-- Criar tabela para armazenar sessões de usuários
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  imobiliaria_id uuid REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  login_at timestamptz NOT NULL DEFAULT now(),
  logout_at timestamptz,
  session_duration_seconds integer,
  ip_address text,
  user_agent text,
  logout_type text DEFAULT 'unknown',
  is_impersonation boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índices para consultas frequentes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_imobiliaria_id ON public.user_sessions(imobiliaria_id);
CREATE INDEX idx_user_sessions_login_at ON public.user_sessions(login_at DESC);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id) WHERE logout_at IS NULL;

-- Habilitar RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Função para calcular duração da sessão automaticamente
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.logout_at IS NOT NULL AND (OLD.logout_at IS NULL OR OLD.logout_at IS DISTINCT FROM NEW.logout_at) THEN
    NEW.session_duration_seconds := EXTRACT(EPOCH FROM (NEW.logout_at - NEW.login_at))::integer;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para calcular duração
CREATE TRIGGER trigger_calculate_session_duration
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_session_duration();

-- Políticas RLS

-- Super admin pode ver todas as sessões
CREATE POLICY "Super admin pode ver todas sessões"
  ON public.user_sessions
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Super admin pode gerenciar sessões
CREATE POLICY "Super admin pode gerenciar sessões"
  ON public.user_sessions
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Admin da imobiliária pode ver sessões da sua imobiliária
CREATE POLICY "Admin imobiliária pode ver sessões da sua imobiliária"
  ON public.user_sessions
  FOR SELECT
  USING (
    imobiliaria_id = get_user_imobiliaria(auth.uid()) 
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

-- Usuário pode criar sua própria sessão
CREATE POLICY "Usuário pode criar sua sessão"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuário pode atualizar sua própria sessão
CREATE POLICY "Usuário pode atualizar sua sessão"
  ON public.user_sessions
  FOR UPDATE
  USING (user_id = auth.uid());

-- Usuário pode ver suas próprias sessões
CREATE POLICY "Usuário pode ver suas sessões"
  ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid());