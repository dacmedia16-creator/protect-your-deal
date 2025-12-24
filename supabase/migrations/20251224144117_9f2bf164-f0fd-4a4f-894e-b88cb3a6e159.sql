-- Create table for message templates
CREATE TABLE public.templates_mensagem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('criacao_proprietario', 'criacao_comprador', 'lembrete', 'confirmacao_completa')),
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)
);

-- Enable RLS
ALTER TABLE public.templates_mensagem ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuários podem ver seus templates"
ON public.templates_mensagem
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar templates"
ON public.templates_mensagem
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus templates"
ON public.templates_mensagem
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus templates"
ON public.templates_mensagem
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_templates_mensagem_updated_at
BEFORE UPDATE ON public.templates_mensagem
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment explaining available variables
COMMENT ON TABLE public.templates_mensagem IS 'Templates de mensagem WhatsApp. Variáveis disponíveis: {nome}, {endereco}, {data_visita}, {codigo}, {link}, {protocolo}, {tipo_imovel}';