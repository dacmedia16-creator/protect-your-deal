
CREATE TABLE public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'default',
  tipo TEXT NOT NULL DEFAULT 'texto',
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  ficha_id UUID,
  user_id UUID,
  imobiliaria_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Service role can insert logs
CREATE POLICY "Service role pode inserir whatsapp_logs"
  ON public.whatsapp_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Super admin can read all logs
CREATE POLICY "Super admin pode ver todos whatsapp_logs"
  ON public.whatsapp_logs
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Imobiliaria admin can read logs from their imobiliaria
CREATE POLICY "Admin imobiliária pode ver whatsapp_logs da sua imobiliária"
  ON public.whatsapp_logs
  FOR SELECT
  TO authenticated
  USING (
    imobiliaria_id IS NOT NULL
    AND imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );
