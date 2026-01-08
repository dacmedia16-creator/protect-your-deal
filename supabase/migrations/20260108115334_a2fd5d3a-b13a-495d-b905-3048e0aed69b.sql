-- Adicionar colunas para dados do corretor parceiro externo
ALTER TABLE convites_parceiro 
ADD COLUMN parceiro_nome TEXT,
ADD COLUMN parceiro_cpf TEXT,
ADD COLUMN parceiro_creci TEXT;