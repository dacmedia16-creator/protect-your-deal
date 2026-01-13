-- Adicionar coluna tipo_cadastro para distinguir planos CPF vs CNPJ
ALTER TABLE planos ADD COLUMN IF NOT EXISTS tipo_cadastro text DEFAULT 'cnpj';

-- Atualizar plano Gratuito para CPF (corretores autônomos)
UPDATE planos SET tipo_cadastro = 'cpf' WHERE nome = 'Gratuito';

-- Demais planos ficam como CNPJ (imobiliárias)
UPDATE planos SET tipo_cadastro = 'cnpj' WHERE nome != 'Gratuito';