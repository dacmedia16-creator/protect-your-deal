-- Permitir que super admin delete backups do bucket comprovantes-backup
CREATE POLICY "Super admin pode deletar backups"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'comprovantes-backup'
  AND public.is_super_admin(auth.uid())
);