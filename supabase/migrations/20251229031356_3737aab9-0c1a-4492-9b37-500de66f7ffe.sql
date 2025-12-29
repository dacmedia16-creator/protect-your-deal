-- Adicionar campos para corretor parceiro na fichas_visita
ALTER TABLE public.fichas_visita 
ADD COLUMN IF NOT EXISTS corretor_parceiro_id UUID,
ADD COLUMN IF NOT EXISTS parte_preenchida_parceiro TEXT CHECK (parte_preenchida_parceiro IN ('proprietario', 'comprador'));

-- Criar tabela de convites para parceiros
CREATE TABLE public.convites_parceiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES public.fichas_visita(id) ON DELETE CASCADE NOT NULL,
  corretor_origem_id UUID NOT NULL,
  corretor_parceiro_telefone TEXT NOT NULL,
  corretor_parceiro_id UUID,
  parte_faltante TEXT NOT NULL CHECK (parte_faltante IN ('proprietario', 'comprador')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'expirado')),
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela convites_parceiro
ALTER TABLE public.convites_parceiro ENABLE ROW LEVEL SECURITY;

-- Policies para convites_parceiro
-- Corretor origem pode ver e criar convites
CREATE POLICY "Corretor origem pode ver seus convites"
ON public.convites_parceiro FOR SELECT
USING (corretor_origem_id = auth.uid());

CREATE POLICY "Corretor origem pode criar convites"
ON public.convites_parceiro FOR INSERT
WITH CHECK (corretor_origem_id = auth.uid());

CREATE POLICY "Corretor origem pode atualizar seus convites"
ON public.convites_parceiro FOR UPDATE
USING (corretor_origem_id = auth.uid());

-- Corretor parceiro pode ver convites para ele (após aceitar)
CREATE POLICY "Corretor parceiro pode ver convites aceitos"
ON public.convites_parceiro FOR SELECT
USING (corretor_parceiro_id = auth.uid());

-- Super admin pode ver todos
CREATE POLICY "Super admin pode ver todos convites parceiro"
ON public.convites_parceiro FOR SELECT
USING (is_super_admin(auth.uid()));

-- Policies adicionais para fichas_visita - Parceiro pode ver/atualizar
CREATE POLICY "Corretor parceiro pode ver fichas"
ON public.fichas_visita FOR SELECT
USING (corretor_parceiro_id = auth.uid());

CREATE POLICY "Corretor parceiro pode atualizar fichas"
ON public.fichas_visita FOR UPDATE
USING (corretor_parceiro_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_convites_parceiro_updated_at
BEFORE UPDATE ON public.convites_parceiro
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();