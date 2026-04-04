-- 5A.3: AFTER DELETE trigger on fichas_visita for audit trail
CREATE OR REPLACE FUNCTION public.audit_fichas_visita_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action, table_name, record_id, user_id,
    old_data, new_data, imobiliaria_id
  ) VALUES (
    'DELETE', 'fichas_visita', OLD.id::text, auth.uid(),
    to_jsonb(OLD), NULL, OLD.imobiliaria_id
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_audit_fichas_visita_delete
  AFTER DELETE ON public.fichas_visita
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_fichas_visita_delete();