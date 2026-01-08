-- Política para Super Admin fazer upload de avatares
CREATE POLICY "Super admin pode fazer upload de avatares"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  bucket_id = 'avatars' 
  AND public.is_super_admin(auth.uid())
);

-- Política para Super Admin atualizar avatares
CREATE POLICY "Super admin pode atualizar avatares"
ON storage.objects FOR UPDATE TO public
USING (
  bucket_id = 'avatars' 
  AND public.is_super_admin(auth.uid())
);

-- Política para Super Admin deletar avatares
CREATE POLICY "Super admin pode deletar avatares"
ON storage.objects FOR DELETE TO public
USING (
  bucket_id = 'avatars' 
  AND public.is_super_admin(auth.uid())
);