DROP POLICY "Sistema pode inserir logs" ON public.audit_logs;

CREATE POLICY "Service role pode inserir logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);