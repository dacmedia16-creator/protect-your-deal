-- Create storage bucket for imobiliaria logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-imobiliarias', 'logos-imobiliarias', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Logos são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos-imobiliarias');

-- Allow imobiliaria admins to upload their own logo
CREATE POLICY "Admin imobiliária pode fazer upload do logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos-imobiliarias' 
  AND (storage.foldername(name))[1] = (SELECT id::text FROM public.imobiliarias WHERE id = public.get_user_imobiliaria(auth.uid()))
);

-- Allow imobiliaria admins to update their own logo
CREATE POLICY "Admin imobiliária pode atualizar seu logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos-imobiliarias'
  AND (storage.foldername(name))[1] = (SELECT id::text FROM public.imobiliarias WHERE id = public.get_user_imobiliaria(auth.uid()))
);

-- Allow imobiliaria admins to delete their own logo
CREATE POLICY "Admin imobiliária pode deletar seu logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos-imobiliarias'
  AND (storage.foldername(name))[1] = (SELECT id::text FROM public.imobiliarias WHERE id = public.get_user_imobiliaria(auth.uid()))
);