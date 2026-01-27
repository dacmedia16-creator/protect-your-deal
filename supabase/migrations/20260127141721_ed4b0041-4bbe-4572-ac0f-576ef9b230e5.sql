-- 1. Criar tabela de remetentes
CREATE TABLE public.email_remetentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nome_exibicao text NOT NULL DEFAULT 'VisitaProva',
  categoria text NOT NULL DEFAULT 'sistema',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Inserir remetentes padrão
INSERT INTO public.email_remetentes (email, nome_exibicao, categoria) VALUES
  ('noreply@visitaprova.com.br', 'VisitaProva', 'sistema'),
  ('suporte@visitaprova.com.br', 'Suporte VisitaProva', 'suporte'),
  ('contato@visitaprova.com.br', 'Contato VisitaProva', 'comercial'),
  ('denis@visitaprova.com.br', 'Denis - VisitaProva', 'admin');

-- 3. Adicionar campo de remetente aos templates
ALTER TABLE public.templates_email 
ADD COLUMN IF NOT EXISTS remetente_email text DEFAULT 'noreply@visitaprova.com.br';

-- 4. Adicionar campo from_email ao log
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS from_email text;

-- 5. RLS para email_remetentes (somente super_admin)
ALTER TABLE public.email_remetentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin pode gerenciar remetentes"
  ON public.email_remetentes FOR ALL
  USING (is_super_admin(auth.uid()));
