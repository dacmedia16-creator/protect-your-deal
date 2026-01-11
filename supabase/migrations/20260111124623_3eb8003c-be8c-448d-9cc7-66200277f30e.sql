-- Tabela para registrar logs de webhook
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'asaas',
  event_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);

-- Habilitar RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Super admin pode ver logs
CREATE POLICY "Super admin pode ver webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Sistema pode inserir logs (sem autenticação - para webhooks externos)
CREATE POLICY "Sistema pode inserir webhook logs"
  ON public.webhook_logs
  FOR INSERT
  WITH CHECK (true);

-- Super admin pode deletar logs antigos
CREATE POLICY "Super admin pode deletar webhook logs"
  ON public.webhook_logs
  FOR DELETE
  USING (public.is_super_admin(auth.uid()));