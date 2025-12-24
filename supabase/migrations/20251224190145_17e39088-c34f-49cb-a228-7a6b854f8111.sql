-- Adicionar colunas para indicar modo de autopreenchimento
ALTER TABLE public.fichas_visita 
  ADD COLUMN IF NOT EXISTS proprietario_autopreenchimento boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS comprador_autopreenchimento boolean DEFAULT false;

-- Permitir que nome seja preenchido depois (quando autopreenchimento)
ALTER TABLE public.fichas_visita 
  ALTER COLUMN proprietario_nome DROP NOT NULL,
  ALTER COLUMN comprador_nome DROP NOT NULL;

-- Adicionar valor padrão para casos de autopreenchimento
COMMENT ON COLUMN public.fichas_visita.proprietario_autopreenchimento IS 'Se true, o proprietário preencherá seus dados ao confirmar';
COMMENT ON COLUMN public.fichas_visita.comprador_autopreenchimento IS 'Se true, o comprador preencherá seus dados ao confirmar';