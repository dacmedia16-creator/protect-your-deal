-- Create public bucket for depoimentos photos
INSERT INTO storage.buckets (id, name, public) VALUES ('depoimentos', 'depoimentos', true);

-- Allow public read access to depoimentos bucket
CREATE POLICY "Public read access for depoimentos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'depoimentos');

-- Allow super_admin to upload files
CREATE POLICY "Super admin can upload depoimentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'depoimentos' 
  AND public.is_super_admin(auth.uid())
);

-- Allow super_admin to update files
CREATE POLICY "Super admin can update depoimentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'depoimentos' 
  AND public.is_super_admin(auth.uid())
);

-- Allow super_admin to delete files
CREATE POLICY "Super admin can delete depoimentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'depoimentos' 
  AND public.is_super_admin(auth.uid())
);