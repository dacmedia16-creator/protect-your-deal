-- Allow brokers to read OTP confirmations for their fichas
CREATE POLICY "Corretores podem ver confirmações de suas fichas" 
ON public.confirmacoes_otp 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM fichas_visita 
  WHERE fichas_visita.id = confirmacoes_otp.ficha_id 
  AND fichas_visita.user_id = auth.uid()
));