ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_construtora_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE CASCADE;

ALTER TABLE public.assinaturas DROP CONSTRAINT IF EXISTS assinaturas_construtora_id_fkey;
ALTER TABLE public.assinaturas ADD CONSTRAINT assinaturas_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE CASCADE;

ALTER TABLE public.fichas_visita DROP CONSTRAINT IF EXISTS fichas_visita_construtora_id_fkey;
ALTER TABLE public.fichas_visita ADD CONSTRAINT fichas_visita_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE SET NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_construtora_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE SET NULL;