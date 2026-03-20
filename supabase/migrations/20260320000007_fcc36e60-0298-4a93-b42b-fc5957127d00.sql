
-- Table for broker referrals (separate from affiliate system)
CREATE TABLE public.indicacoes_corretor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_user_id uuid NOT NULL,
  indicado_user_id uuid,
  indicado_imobiliaria_id uuid,
  tipo_indicado text NOT NULL DEFAULT 'corretor',
  codigo text UNIQUE NOT NULL,
  comissao_percentual numeric NOT NULL DEFAULT 10,
  valor_comissao numeric DEFAULT 0,
  comissao_paga boolean NOT NULL DEFAULT false,
  comissao_paga_em timestamptz,
  observacao_pagamento text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indicacoes_corretor ENABLE ROW LEVEL SECURITY;

-- RLS: User can see their own referrals (as indicador)
CREATE POLICY "Corretor pode ver suas indicações"
  ON public.indicacoes_corretor
  FOR SELECT
  TO authenticated
  USING (indicador_user_id = auth.uid());

-- RLS: User can insert their own referrals
CREATE POLICY "Corretor pode criar indicações"
  ON public.indicacoes_corretor
  FOR INSERT
  TO authenticated
  WITH CHECK (indicador_user_id = auth.uid());

-- RLS: Super admin full access
CREATE POLICY "Super admin pode gerenciar indicações"
  ON public.indicacoes_corretor
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Insert default config for referral commission percentages
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES 
  ('indicacao_comissao_corretor', '10', 'Percentual de comissão para indicação de corretores'),
  ('indicacao_comissao_imobiliaria', '10', 'Percentual de comissão para indicação de imobiliárias')
ON CONFLICT (chave) DO NOTHING;
