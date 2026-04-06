DROP POLICY "Service role pode inserir backups" ON storage.objects;

CREATE POLICY "Service role pode inserir backups"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'comprovantes-backup');