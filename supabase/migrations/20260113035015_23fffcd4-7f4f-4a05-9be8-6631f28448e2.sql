-- Dropar a view existente
DROP VIEW IF EXISTS imobiliarias_publicas;

-- Criar função SECURITY DEFINER para retornar imobiliárias públicas
CREATE OR REPLACE FUNCTION get_imobiliarias_publicas()
RETURNS TABLE (
  id uuid,
  nome text,
  codigo integer,
  logo_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, nome, codigo, logo_url
  FROM imobiliarias
  WHERE status = 'ativo';
$$;

-- Recriar a view usando a função
CREATE VIEW imobiliarias_publicas AS
SELECT * FROM get_imobiliarias_publicas();

-- Garantir que usuários anônimos possam acessar
GRANT SELECT ON imobiliarias_publicas TO anon;
GRANT SELECT ON imobiliarias_publicas TO authenticated;
GRANT EXECUTE ON FUNCTION get_imobiliarias_publicas() TO anon;
GRANT EXECUTE ON FUNCTION get_imobiliarias_publicas() TO authenticated;