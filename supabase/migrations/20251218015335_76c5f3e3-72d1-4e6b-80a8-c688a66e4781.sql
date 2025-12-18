-- Corrigir search_path nas funções
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_protocolo()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  prefix TEXT := 'VS';
  year_part TEXT := to_char(now(), 'YY');
  random_part TEXT := upper(substr(md5(random()::text), 1, 6));
BEGIN
  RETURN prefix || year_part || random_part;
END;
$$;