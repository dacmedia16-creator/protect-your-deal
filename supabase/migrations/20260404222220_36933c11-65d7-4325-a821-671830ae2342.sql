-- 5A.1: Allow authenticated users to INSERT VIEW logs into audit_logs
CREATE POLICY "Authenticated users can log VIEW actions"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  action = 'VIEW'
  AND user_id = auth.uid()
  AND table_name IN ('fichas_visita')
);