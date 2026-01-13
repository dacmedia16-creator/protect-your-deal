-- Create OTP Queue table for batch processing
CREATE TABLE public.otp_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid NOT NULL REFERENCES fichas_visita(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('proprietario', 'comprador')),
  app_url text,
  prioridade integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'processando', 'enviado', 'falhou')),
  tentativas integer DEFAULT 0,
  ultimo_erro text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  user_id uuid REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_otp_queue_status ON otp_queue(status) WHERE status = 'pendente';
CREATE INDEX idx_otp_queue_created ON otp_queue(created_at);
CREATE INDEX idx_otp_queue_prioridade ON otp_queue(prioridade DESC, created_at ASC);

-- Enable RLS
ALTER TABLE otp_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own queue items
CREATE POLICY "Users can insert their own otp queue items" 
ON otp_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own queue items
CREATE POLICY "Users can view their own otp queue items" 
ON otp_queue 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can update their own queue items
CREATE POLICY "Users can update their own otp queue items" 
ON otp_queue 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Service role can manage all items (for edge function processing)
CREATE POLICY "Service role can manage all otp queue items" 
ON otp_queue 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE otp_queue IS 'Queue for batch OTP sending to avoid overloading edge functions during mass ficha creation';