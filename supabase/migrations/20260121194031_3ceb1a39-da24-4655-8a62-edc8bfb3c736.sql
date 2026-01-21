-- Índices para convites_parceiro (acelerar filtros)
CREATE INDEX IF NOT EXISTS idx_convites_parceiro_corretor_parceiro_id 
  ON convites_parceiro(corretor_parceiro_id);

CREATE INDEX IF NOT EXISTS idx_convites_parceiro_corretor_origem_id 
  ON convites_parceiro(corretor_origem_id);

CREATE INDEX IF NOT EXISTS idx_convites_parceiro_status 
  ON convites_parceiro(status);

CREATE INDEX IF NOT EXISTS idx_convites_parceiro_telefone 
  ON convites_parceiro(corretor_parceiro_telefone);

-- Índice composto para query mais comum (status + parceiro)
CREATE INDEX IF NOT EXISTS idx_convites_parceiro_status_parceiro 
  ON convites_parceiro(status, corretor_parceiro_id);

-- Índice para profiles.telefone (acelerar busca por telefone)
CREATE INDEX IF NOT EXISTS idx_profiles_telefone 
  ON profiles(telefone);