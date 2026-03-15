DROP POLICY "Sistema pode inserir webhook logs" ON public.webhook_logs;

CREATE POLICY "Service role pode inserir webhook logs"
ON public.webhook_logs
FOR INSERT
TO service_role
WITH CHECK (true);