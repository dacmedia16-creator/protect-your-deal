DROP POLICY "Admin imobiliária pode ver logs da sua imobiliária" ON public.audit_logs;

CREATE POLICY "Admin imobiliária pode ver logs da sua imobiliária"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);