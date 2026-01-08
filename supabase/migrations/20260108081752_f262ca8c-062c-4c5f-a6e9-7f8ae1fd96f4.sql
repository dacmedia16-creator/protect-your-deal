-- Política para Super Admin fazer upload de logos
CREATE POLICY "Super admin pode fazer upload de logos"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  bucket_id = 'logos-imobiliarias' 
  AND public.is_super_admin(auth.uid())
);

-- Política para Super Admin atualizar logos
CREATE POLICY "Super admin pode atualizar logos"
ON storage.objects FOR UPDATE TO public
USING (
  bucket_id = 'logos-imobiliarias' 
  AND public.is_super_admin(auth.uid())
);

-- Política para Super Admin deletar logos
CREATE POLICY "Super admin pode deletar logos"
ON storage.objects FOR DELETE TO public
USING (
  bucket_id = 'logos-imobiliarias' 
  AND public.is_super_admin(auth.uid())
);