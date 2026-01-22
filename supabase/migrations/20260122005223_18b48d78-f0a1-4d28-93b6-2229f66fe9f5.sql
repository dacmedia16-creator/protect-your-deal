-- Step 1: Allow user_id to be NULL in fichas_visita
ALTER TABLE public.fichas_visita 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop the existing CASCADE constraint and add SET NULL
-- First find and drop the existing constraint, then add a new one
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name for user_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'fichas_visita' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id';
    
    -- If found, drop it
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.fichas_visita DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Step 3: Add new foreign key with ON DELETE SET NULL
ALTER TABLE public.fichas_visita 
ADD CONSTRAINT fichas_visita_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 4: Create helper function to get imobiliaria admin
CREATE OR REPLACE FUNCTION public.get_imobiliaria_admin(imob_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id 
  FROM user_roles 
  WHERE imobiliaria_id = imob_id 
    AND role = 'imobiliaria_admin'
  LIMIT 1;
$$;