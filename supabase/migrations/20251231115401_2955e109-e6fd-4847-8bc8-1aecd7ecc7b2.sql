-- Função para normalizar telefone (remover tudo exceto dígitos)
CREATE OR REPLACE FUNCTION public.normalize_phone(phone_number text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF phone_number IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN regexp_replace(phone_number, '[^0-9]', '', 'g');
END;
$$;

-- Normalizar telefones existentes na tabela profiles
UPDATE public.profiles
SET telefone = normalize_phone(telefone)
WHERE telefone IS NOT NULL AND telefone ~ '[^0-9]';

-- Normalizar telefones existentes na tabela clientes
UPDATE public.clientes
SET telefone = normalize_phone(telefone)
WHERE telefone ~ '[^0-9]';

-- Normalizar telefones existentes na tabela imobiliarias
UPDATE public.imobiliarias
SET telefone = normalize_phone(telefone)
WHERE telefone IS NOT NULL AND telefone ~ '[^0-9]';

-- Normalizar telefones existentes na tabela fichas_visita
UPDATE public.fichas_visita
SET 
  proprietario_telefone = normalize_phone(proprietario_telefone),
  comprador_telefone = normalize_phone(comprador_telefone)
WHERE 
  (proprietario_telefone IS NOT NULL AND proprietario_telefone ~ '[^0-9]')
  OR (comprador_telefone IS NOT NULL AND comprador_telefone ~ '[^0-9]');

-- Normalizar telefones existentes na tabela convites_parceiro
UPDATE public.convites_parceiro
SET corretor_parceiro_telefone = normalize_phone(corretor_parceiro_telefone)
WHERE corretor_parceiro_telefone ~ '[^0-9]';

-- Trigger para normalizar telefone automaticamente em profiles
CREATE OR REPLACE FUNCTION public.normalize_profile_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.telefone = normalize_phone(NEW.telefone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_profile_phone
  BEFORE INSERT OR UPDATE OF telefone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_profile_phone();

-- Trigger para normalizar telefone automaticamente em clientes
CREATE OR REPLACE FUNCTION public.normalize_cliente_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.telefone = normalize_phone(NEW.telefone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_cliente_phone
  BEFORE INSERT OR UPDATE OF telefone ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_cliente_phone();

-- Trigger para normalizar telefone automaticamente em imobiliarias
CREATE OR REPLACE FUNCTION public.normalize_imobiliaria_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.telefone = normalize_phone(NEW.telefone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_imobiliaria_phone
  BEFORE INSERT OR UPDATE OF telefone ON public.imobiliarias
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_imobiliaria_phone();

-- Trigger para normalizar telefones automaticamente em fichas_visita
CREATE OR REPLACE FUNCTION public.normalize_ficha_phones()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.proprietario_telefone = normalize_phone(NEW.proprietario_telefone);
  NEW.comprador_telefone = normalize_phone(NEW.comprador_telefone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_ficha_phones
  BEFORE INSERT OR UPDATE OF proprietario_telefone, comprador_telefone ON public.fichas_visita
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_ficha_phones();

-- Trigger para normalizar telefone automaticamente em convites_parceiro
CREATE OR REPLACE FUNCTION public.normalize_convite_parceiro_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.corretor_parceiro_telefone = normalize_phone(NEW.corretor_parceiro_telefone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_convite_parceiro_phone
  BEFORE INSERT OR UPDATE OF corretor_parceiro_telefone ON public.convites_parceiro
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_convite_parceiro_phone();