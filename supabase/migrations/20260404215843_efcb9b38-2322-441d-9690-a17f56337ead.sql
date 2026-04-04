
-- Remove redundant super_admin DELETE policy (already covered by ALL policy)
DROP POLICY IF EXISTS "Super admin pode deletar surveys" ON public.surveys;
