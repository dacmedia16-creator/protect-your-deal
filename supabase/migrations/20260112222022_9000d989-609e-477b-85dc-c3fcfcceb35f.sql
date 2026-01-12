-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admin da imobiliaria pode criar equipes" ON public.equipes;

-- Create the correct policy with proper comparison
CREATE POLICY "Admin da imobiliaria pode criar equipes"
ON public.equipes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.imobiliaria_id = equipes.imobiliaria_id
      AND ur.role = ANY (ARRAY['imobiliaria_admin'::app_role, 'super_admin'::app_role])
  )
);