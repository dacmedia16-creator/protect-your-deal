
-- 1. Trigger de auditoria automática para alterações em fichas_visita
CREATE OR REPLACE FUNCTION public.audit_fichas_visita_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  changed_fields jsonb := '{}';
  old_values jsonb := '{}';
  critical_fields text[] := ARRAY[
    'proprietario_nome', 'proprietario_cpf', 'proprietario_telefone',
    'comprador_nome', 'comprador_cpf', 'comprador_telefone',
    'imovel_endereco', 'imovel_tipo', 'data_visita', 'status',
    'convertido_venda', 'valor_venda', 'observacoes'
  ];
  f text;
BEGIN
  -- Only track changes to critical fields
  FOREACH f IN ARRAY critical_fields
  LOOP
    IF to_jsonb(NEW) ->> f IS DISTINCT FROM to_jsonb(OLD) ->> f THEN
      changed_fields := changed_fields || jsonb_build_object(f, to_jsonb(NEW) ->> f);
      old_values := old_values || jsonb_build_object(f, to_jsonb(OLD) ->> f);
    END IF;
  END LOOP;

  -- Only log if critical fields changed
  IF changed_fields != '{}' THEN
    INSERT INTO public.audit_logs (
      action, table_name, record_id, user_id,
      old_data, new_data, imobiliaria_id
    ) VALUES (
      'UPDATE', 'fichas_visita', NEW.id::text, auth.uid(),
      old_values, changed_fields, NEW.imobiliaria_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_audit_fichas_visita
  AFTER UPDATE ON public.fichas_visita
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_fichas_visita_changes();
