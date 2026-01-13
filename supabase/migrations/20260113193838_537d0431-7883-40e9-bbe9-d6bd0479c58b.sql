-- Habilitar REPLICA IDENTITY FULL para capturar dados completos (necessário para comparar old vs new)
ALTER TABLE public.fichas_visita REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fichas_visita;