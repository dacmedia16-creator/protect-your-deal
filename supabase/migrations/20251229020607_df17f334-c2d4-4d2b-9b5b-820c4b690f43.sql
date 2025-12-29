-- Permitir criação de fichas parciais (apenas uma parte preenchida)
ALTER TABLE public.fichas_visita ALTER COLUMN proprietario_telefone DROP NOT NULL;
ALTER TABLE public.fichas_visita ALTER COLUMN comprador_telefone DROP NOT NULL;