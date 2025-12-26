-- Atualizar função handle_new_user para também criar role padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email));
  
  -- Atribuir role padrão 'corretor' apenas se não existir
  -- (convites e registro de imobiliária já criam o role antes)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;