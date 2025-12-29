-- Remover a constraint antiga
ALTER TABLE fichas_visita DROP CONSTRAINT IF EXISTS fichas_visita_status_check;

-- Criar nova constraint com o valor adicional
ALTER TABLE fichas_visita ADD CONSTRAINT fichas_visita_status_check 
CHECK (status = ANY (ARRAY['pendente', 'aguardando_comprador', 'aguardando_proprietario', 'completo', 'expirado', 'finalizado_parcial']));