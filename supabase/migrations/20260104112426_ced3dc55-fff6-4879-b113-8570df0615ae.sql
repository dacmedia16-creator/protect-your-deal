-- Criar bucket privado para comprovantes de backup
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-backup', 'comprovantes-backup', false);

-- Política RLS: Apenas super_admin pode ver os backups
CREATE POLICY "Super admin pode ver backups" ON storage.objects
FOR SELECT USING (
  bucket_id = 'comprovantes-backup' 
  AND public.is_super_admin(auth.uid())
);

-- Política para service role inserir backups (via edge function)
CREATE POLICY "Service role pode inserir backups" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'comprovantes-backup');

-- Adicionar campo para controlar se backup foi gerado
ALTER TABLE public.fichas_visita 
ADD COLUMN backup_gerado_em TIMESTAMP WITH TIME ZONE;