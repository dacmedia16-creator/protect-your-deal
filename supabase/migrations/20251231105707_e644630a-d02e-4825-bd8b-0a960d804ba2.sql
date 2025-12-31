-- Criar tabela de módulos disponíveis
CREATE TABLE public.modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  valor_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  recursos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de módulos contratados
CREATE TABLE public.modulos_contratados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  asaas_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT modulos_contratados_owner_check CHECK (
    (imobiliaria_id IS NOT NULL AND user_id IS NULL) OR
    (imobiliaria_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Habilitar RLS
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_contratados ENABLE ROW LEVEL SECURITY;

-- Políticas para modulos
CREATE POLICY "Qualquer um pode ver módulos ativos"
ON public.modulos FOR SELECT
USING (ativo = true);

CREATE POLICY "Super admin pode gerenciar módulos"
ON public.modulos FOR ALL
USING (is_super_admin(auth.uid()));

-- Políticas para modulos_contratados
CREATE POLICY "Usuário pode ver seus módulos contratados"
ON public.modulos_contratados FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin imobiliária pode ver módulos da sua imobiliária"
ON public.modulos_contratados FOR SELECT
USING (
  imobiliaria_id = get_user_imobiliaria(auth.uid()) AND
  is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);

CREATE POLICY "Corretor da imobiliária pode ver módulos da empresa"
ON public.modulos_contratados FOR SELECT
USING (imobiliaria_id = get_user_imobiliaria(auth.uid()));

CREATE POLICY "Super admin pode gerenciar módulos contratados"
ON public.modulos_contratados FOR ALL
USING (is_super_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_modulos_updated_at
BEFORE UPDATE ON public.modulos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modulos_contratados_updated_at
BEFORE UPDATE ON public.modulos_contratados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir módulo Avançado
INSERT INTO public.modulos (nome, codigo, descricao, valor_mensal, recursos, ativo)
VALUES (
  'Avançado',
  'avancado',
  'Desbloqueie todas as funcionalidades premium: Agenda Pro, Duplicação de Fichas, Dashboard com Insights, Histórico por Imóvel, Busca Avançada, Follow-up Automático e Compartilhamento Rápido.',
  49.90,
  '["agenda_pro", "duplicar_ficha", "dashboard_insights", "historico_imovel", "busca_avancada", "followup_auto", "compartilhamento_rapido"]'::jsonb,
  true
);