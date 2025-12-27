-- Recriar a função handle_new_user com ON CONFLICT corrigido
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email));
  
  -- Atribuir role padrão 'corretor' apenas se não existir
  -- (convites e registro de imobiliária já criam o role antes)
  -- Usando ON CONFLICT com as colunas corretas da constraint única
  INSERT INTO public.user_roles (user_id, role, imobiliaria_id)
  VALUES (NEW.id, 'corretor', NULL)
  ON CONFLICT (user_id, role, imobiliaria_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;