-- Add parent_id column to equipes table for hierarchical structure
ALTER TABLE public.equipes
ADD COLUMN parent_id UUID REFERENCES public.equipes(id) ON DELETE CASCADE;

-- Create index for better performance on hierarchical queries
CREATE INDEX idx_equipes_parent_id ON public.equipes(parent_id);

-- Add constraint to prevent more than 2 levels of depth
CREATE OR REPLACE FUNCTION public.check_equipe_depth()
RETURNS TRIGGER AS $$
DECLARE
  parent_depth INTEGER := 0;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Check if parent already has a parent (would make this 3rd level)
    SELECT 
      CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END INTO parent_depth
    FROM public.equipes
    WHERE id = NEW.parent_id;
    
    IF parent_depth > 0 THEN
      RAISE EXCEPTION 'Sub-equipes não podem ter mais de 2 níveis de profundidade';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_equipe_depth_trigger
BEFORE INSERT OR UPDATE ON public.equipes
FOR EACH ROW
EXECUTE FUNCTION public.check_equipe_depth();

-- Add constraint to ensure sub-team has same imobiliaria_id as parent
CREATE OR REPLACE FUNCTION public.check_equipe_imobiliaria()
RETURNS TRIGGER AS $$
DECLARE
  parent_imobiliaria UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT imobiliaria_id INTO parent_imobiliaria
    FROM public.equipes
    WHERE id = NEW.parent_id;
    
    IF parent_imobiliaria != NEW.imobiliaria_id THEN
      RAISE EXCEPTION 'Sub-equipe deve pertencer à mesma imobiliária da equipe pai';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_equipe_imobiliaria_trigger
BEFORE INSERT OR UPDATE ON public.equipes
FOR EACH ROW
EXECUTE FUNCTION public.check_equipe_imobiliaria();