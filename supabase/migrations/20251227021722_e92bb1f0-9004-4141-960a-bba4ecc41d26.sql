-- Atualizar trigger para NÃO criar user_role automaticamente
-- O role será criado pela edge function ou pelo fluxo de convite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas criar perfil - role será criado pelo fluxo apropriado
  -- (admin-create-corretor, AceitarConvite, registro-imobiliaria)
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email));
  
  RETURN NEW;
END;
$$;

-- Limpar roles órfãos que foram criados pelo trigger antigo (sem imobiliaria_id)
-- mas que já possuem um role válido com imobiliaria_id
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.user_id = b.user_id
  AND a.role = b.role
  AND a.imobiliaria_id IS NULL
  AND b.imobiliaria_id IS NOT NULL;