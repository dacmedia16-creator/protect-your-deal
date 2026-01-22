-- Função para verificar se telefone está disponível
CREATE OR REPLACE FUNCTION public.check_phone_available(phone_number text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = regexp_replace(phone_number, '[^0-9]', '', 'g')
    AND telefone IS NOT NULL 
    AND telefone != ''
  );
$$;

-- Conceder permissão para usuários anônimos e autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.check_phone_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_phone_available(text) TO authenticated;