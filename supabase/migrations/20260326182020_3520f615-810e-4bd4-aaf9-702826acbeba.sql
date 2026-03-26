CREATE POLICY "Construtora admin pode fazer upload de logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos-construtoras'
  AND (storage.foldername(name))[1] = (get_user_construtora(auth.uid()))::text
);

CREATE POLICY "Construtora admin pode atualizar logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos-construtoras'
  AND (storage.foldername(name))[1] = (get_user_construtora(auth.uid()))::text
);

CREATE POLICY "Construtora admin pode deletar logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos-construtoras'
  AND (storage.foldername(name))[1] = (get_user_construtora(auth.uid()))::text
);

CREATE POLICY "Qualquer um pode ver logos de construtoras"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos-construtoras');

CREATE POLICY "Super admin full access logos construtoras"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'logos-construtoras'
  AND is_super_admin(auth.uid())
);