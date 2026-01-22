-- Corrigir Foreign Keys para ON DELETE CASCADE

-- 1. Corrigir afiliados (se existir constraint)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'afiliados_user_id_fkey') THEN
    ALTER TABLE public.afiliados DROP CONSTRAINT afiliados_user_id_fkey;
    ALTER TABLE public.afiliados 
      ADD CONSTRAINT afiliados_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Corrigir otp_queue (se existir constraint)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'otp_queue_user_id_fkey') THEN
    ALTER TABLE public.otp_queue DROP CONSTRAINT otp_queue_user_id_fkey;
    ALTER TABLE public.otp_queue 
      ADD CONSTRAINT otp_queue_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Corrigir equipes_membros para referenciar auth.users(id) com CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipes_membros_user_id_fkey') THEN
    ALTER TABLE public.equipes_membros DROP CONSTRAINT equipes_membros_user_id_fkey;
  END IF;
  
  -- Adicionar nova constraint referenciando auth.users
  ALTER TABLE public.equipes_membros 
    ADD CONSTRAINT equipes_membros_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 4. Corrigir audit_logs - SET NULL para preservar histórico
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey') THEN
    ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
    ALTER TABLE public.audit_logs 
      ADD CONSTRAINT audit_logs_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;