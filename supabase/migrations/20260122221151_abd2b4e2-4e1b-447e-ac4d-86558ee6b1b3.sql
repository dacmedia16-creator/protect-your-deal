-- First, set invalid lider_id values to NULL (those that reference profiles.id instead of profiles.user_id)
UPDATE public.equipes 
SET lider_id = NULL 
WHERE lider_id IS NOT NULL 
  AND lider_id NOT IN (SELECT user_id FROM profiles WHERE user_id IS NOT NULL);

-- Now remove the incorrect foreign key constraint
ALTER TABLE public.equipes DROP CONSTRAINT IF EXISTS equipes_lider_id_fkey;

-- Recreate it referencing profiles(user_id) instead of profiles(id)
ALTER TABLE public.equipes
ADD CONSTRAINT equipes_lider_id_fkey 
  FOREIGN KEY (lider_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;