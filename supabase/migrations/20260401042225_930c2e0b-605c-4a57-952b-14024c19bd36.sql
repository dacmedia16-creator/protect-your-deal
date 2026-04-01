ALTER TABLE convites_parceiro DROP CONSTRAINT convites_parceiro_status_check;
ALTER TABLE convites_parceiro ADD CONSTRAINT convites_parceiro_status_check 
  CHECK (status = ANY (ARRAY['pendente', 'aceito', 'expirado', 'arquivado']));