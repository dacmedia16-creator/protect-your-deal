-- Limpar roles duplicados existentes
-- Remove entradas com imobiliaria_id NULL quando existe uma com imobiliaria_id preenchido para o mesmo user_id e role
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.user_id = b.user_id
  AND a.role = b.role
  AND a.imobiliaria_id IS NULL
  AND b.imobiliaria_id IS NOT NULL;