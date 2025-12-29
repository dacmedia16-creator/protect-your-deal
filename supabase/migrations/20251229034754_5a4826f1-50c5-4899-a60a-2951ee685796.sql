-- Normalizar telefones existentes na tabela profiles (remover formatação)
UPDATE profiles 
SET telefone = REGEXP_REPLACE(telefone, '[^0-9]', '', 'g')
WHERE telefone IS NOT NULL AND telefone ~ '[^0-9]';

-- Normalizar telefones existentes na tabela clientes (remover formatação)
UPDATE clientes 
SET telefone = REGEXP_REPLACE(telefone, '[^0-9]', '', 'g')
WHERE telefone IS NOT NULL AND telefone ~ '[^0-9]';