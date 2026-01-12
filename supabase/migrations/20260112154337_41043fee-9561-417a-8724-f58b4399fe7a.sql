-- Create system configurations table
CREATE TABLE public.configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL DEFAULT '{}',
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration for OTP reminders (enabled by default)
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES ('lembretes_otp_ativo', 'true', 'Ativa/desativa lembretes automáticos de OTP');

-- Enable RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Super admin can view configurations
CREATE POLICY "Super admin pode ver configurações"
  ON public.configuracoes_sistema FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admin can update configurations
CREATE POLICY "Super admin pode atualizar configurações"
  ON public.configuracoes_sistema FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admin can insert configurations
CREATE POLICY "Super admin pode inserir configurações"
  ON public.configuracoes_sistema FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
  BEFORE UPDATE ON public.configuracoes_sistema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();