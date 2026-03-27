
-- 1. Make imobiliaria_id nullable on equipes
ALTER TABLE public.equipes ALTER COLUMN imobiliaria_id DROP NOT NULL;

-- 2. Add construtora_id column
ALTER TABLE public.equipes ADD COLUMN construtora_id uuid REFERENCES public.construtoras(id);

-- 3. Add check constraint: at least one owner must be set
ALTER TABLE public.equipes ADD CONSTRAINT check_equipe_owner
  CHECK (imobiliaria_id IS NOT NULL OR construtora_id IS NOT NULL);

-- 4. Index for construtora queries
CREATE INDEX idx_equipes_construtora_id ON public.equipes(construtora_id) WHERE construtora_id IS NOT NULL;

-- 5. RLS: Construtora admin can SELECT equipes
CREATE POLICY "Construtora admin pode ver equipes"
ON public.equipes
FOR SELECT
TO authenticated
USING (
  construtora_id IS NOT NULL 
  AND construtora_id = get_user_construtora(auth.uid())
);

-- 6. RLS: Construtora admin can INSERT equipes
CREATE POLICY "Construtora admin pode criar equipes"
ON public.equipes
FOR INSERT
TO authenticated
WITH CHECK (
  construtora_id IS NOT NULL
  AND is_construtora_admin(auth.uid(), construtora_id)
);

-- 7. RLS: Construtora admin can UPDATE equipes
CREATE POLICY "Construtora admin pode atualizar equipes"
ON public.equipes
FOR UPDATE
TO authenticated
USING (
  construtora_id IS NOT NULL
  AND is_construtora_admin(auth.uid(), construtora_id)
);

-- 8. RLS: Construtora admin can DELETE equipes
CREATE POLICY "Construtora admin pode deletar equipes"
ON public.equipes
FOR DELETE
TO authenticated
USING (
  construtora_id IS NOT NULL
  AND is_construtora_admin(auth.uid(), construtora_id)
);

-- 9. RLS on equipes_membros for construtora admin SELECT
CREATE POLICY "Construtora admin pode ver membros de equipes"
ON public.equipes_membros
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM equipes e
    WHERE e.id = equipes_membros.equipe_id
      AND e.construtora_id IS NOT NULL
      AND e.construtora_id = get_user_construtora(auth.uid())
  )
);

-- 10. RLS on equipes_membros for construtora admin INSERT
CREATE POLICY "Construtora admin pode adicionar membros"
ON public.equipes_membros
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM equipes e
    WHERE e.id = equipes_membros.equipe_id
      AND e.construtora_id IS NOT NULL
      AND is_construtora_admin(auth.uid(), e.construtora_id)
  )
);

-- 11. RLS on equipes_membros for construtora admin UPDATE
CREATE POLICY "Construtora admin pode atualizar membros de equipes"
ON public.equipes_membros
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM equipes e
    WHERE e.id = equipes_membros.equipe_id
      AND e.construtora_id IS NOT NULL
      AND is_construtora_admin(auth.uid(), e.construtora_id)
  )
);

-- 12. RLS on equipes_membros for construtora admin DELETE
CREATE POLICY "Construtora admin pode remover membros de equipes"
ON public.equipes_membros
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM equipes e
    WHERE e.id = equipes_membros.equipe_id
      AND e.construtora_id IS NOT NULL
      AND is_construtora_admin(auth.uid(), e.construtora_id)
  )
);

-- 13. Update check_equipe_imobiliaria trigger to support construtora
CREATE OR REPLACE FUNCTION public.check_equipe_imobiliaria()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  parent_imobiliaria UUID;
  parent_construtora UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT imobiliaria_id, construtora_id INTO parent_imobiliaria, parent_construtora
    FROM public.equipes
    WHERE id = NEW.parent_id;
    
    IF NEW.imobiliaria_id IS NOT NULL AND parent_imobiliaria != NEW.imobiliaria_id THEN
      RAISE EXCEPTION 'Sub-equipe deve pertencer à mesma imobiliária da equipe pai';
    END IF;
    
    IF NEW.construtora_id IS NOT NULL AND parent_construtora != NEW.construtora_id THEN
      RAISE EXCEPTION 'Sub-equipe deve pertencer à mesma construtora da equipe pai';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
