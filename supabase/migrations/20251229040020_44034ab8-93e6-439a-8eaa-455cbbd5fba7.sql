-- Habilitar realtime para a tabela convites_parceiro
ALTER TABLE convites_parceiro REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE convites_parceiro;