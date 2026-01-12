-- Fix function search_path for check_equipe_depth
CREATE OR REPLACE FUNCTION public.check_equipe_depth()
RETURNS TRIGGER AS $$
DECLARE
  parent_depth INTEGER := 0;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
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
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix function search_path for check_equipe_imobiliaria
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
$$ LANGUAGE plpgsql SET search_path = public;