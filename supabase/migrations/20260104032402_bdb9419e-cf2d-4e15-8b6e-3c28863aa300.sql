-- Add column to allow external partners (no login required)
ALTER TABLE convites_parceiro 
ADD COLUMN IF NOT EXISTS permite_externo BOOLEAN DEFAULT false;