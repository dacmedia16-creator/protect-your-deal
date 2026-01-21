-- Add unique constraint on telefone column to prevent duplicates
-- Using a partial index to only enforce uniqueness for non-null, non-empty values
CREATE UNIQUE INDEX idx_profiles_telefone_unique 
ON profiles (telefone) 
WHERE telefone IS NOT NULL AND telefone != '';