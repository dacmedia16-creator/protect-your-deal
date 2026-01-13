-- Tabela de afiliados (pessoas que indicam)
CREATE TABLE public.afiliados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  pix_chave TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cupons de desconto
CREATE TABLE public.cupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  afiliado_id UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percentual', 'fixo')),
  valor_desconto NUMERIC NOT NULL CHECK (valor_desconto > 0),
  comissao_percentual NUMERIC NOT NULL DEFAULT 0 CHECK (comissao_percentual >= 0 AND comissao_percentual <= 100),
  valido_ate DATE,
  max_usos INTEGER,
  usos_atuais INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de registro de uso dos cupons
CREATE TABLE public.cupons_usos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cupom_id UUID NOT NULL REFERENCES public.cupons(id) ON DELETE CASCADE,
  assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  user_id UUID,
  valor_original NUMERIC NOT NULL,
  valor_desconto NUMERIC NOT NULL,
  valor_comissao NUMERIC NOT NULL DEFAULT 0,
  comissao_paga BOOLEAN NOT NULL DEFAULT false,
  comissao_paga_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX idx_cupons_afiliado_id ON public.cupons(afiliado_id);
CREATE INDEX idx_cupons_usos_cupom_id ON public.cupons_usos(cupom_id);
CREATE INDEX idx_cupons_usos_assinatura_id ON public.cupons_usos(assinatura_id);
CREATE INDEX idx_cupons_usos_comissao_paga ON public.cupons_usos(comissao_paga);

-- Enable RLS
ALTER TABLE public.afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons_usos ENABLE ROW LEVEL SECURITY;

-- Políticas para afiliados (apenas super_admin pode gerenciar)
CREATE POLICY "Super admins can manage afiliados"
ON public.afiliados
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Políticas para cupons
CREATE POLICY "Super admins can manage cupons"
ON public.cupons
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Política para validação de cupom (público pode ler cupons ativos para validação)
CREATE POLICY "Anyone can read active cupons for validation"
ON public.cupons
FOR SELECT
USING (ativo = true);

-- Políticas para cupons_usos
CREATE POLICY "Super admins can manage cupons_usos"
ON public.cupons_usos
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_afiliados_updated_at
BEFORE UPDATE ON public.afiliados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cupons_updated_at
BEFORE UPDATE ON public.cupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar cupom
CREATE OR REPLACE FUNCTION public.validar_cupom(codigo_cupom TEXT)
RETURNS TABLE (
  cupom_id UUID,
  afiliado_id UUID,
  afiliado_nome TEXT,
  tipo_desconto TEXT,
  valor_desconto NUMERIC,
  comissao_percentual NUMERIC,
  valido BOOLEAN,
  mensagem TEXT
) AS $$
DECLARE
  v_cupom RECORD;
BEGIN
  -- Buscar cupom
  SELECT c.*, a.nome as afiliado_nome
  INTO v_cupom
  FROM public.cupons c
  JOIN public.afiliados a ON a.id = c.afiliado_id
  WHERE UPPER(c.codigo) = UPPER(codigo_cupom);

  -- Cupom não encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, 
      NULL::NUMERIC, NULL::NUMERIC, false, 'Cupom não encontrado'::TEXT;
    RETURN;
  END IF;

  -- Cupom inativo
  IF NOT v_cupom.ativo THEN
    RETURN QUERY SELECT 
      v_cupom.id, v_cupom.afiliado_id, v_cupom.afiliado_nome, 
      v_cupom.tipo_desconto, v_cupom.valor_desconto, v_cupom.comissao_percentual,
      false, 'Cupom inativo'::TEXT;
    RETURN;
  END IF;

  -- Afiliado inativo
  IF NOT EXISTS (SELECT 1 FROM public.afiliados WHERE id = v_cupom.afiliado_id AND ativo = true) THEN
    RETURN QUERY SELECT 
      v_cupom.id, v_cupom.afiliado_id, v_cupom.afiliado_nome, 
      v_cupom.tipo_desconto, v_cupom.valor_desconto, v_cupom.comissao_percentual,
      false, 'Afiliado inativo'::TEXT;
    RETURN;
  END IF;

  -- Cupom expirado
  IF v_cupom.valido_ate IS NOT NULL AND v_cupom.valido_ate < CURRENT_DATE THEN
    RETURN QUERY SELECT 
      v_cupom.id, v_cupom.afiliado_id, v_cupom.afiliado_nome, 
      v_cupom.tipo_desconto, v_cupom.valor_desconto, v_cupom.comissao_percentual,
      false, 'Cupom expirado'::TEXT;
    RETURN;
  END IF;

  -- Limite de usos atingido
  IF v_cupom.max_usos IS NOT NULL AND v_cupom.usos_atuais >= v_cupom.max_usos THEN
    RETURN QUERY SELECT 
      v_cupom.id, v_cupom.afiliado_id, v_cupom.afiliado_nome, 
      v_cupom.tipo_desconto, v_cupom.valor_desconto, v_cupom.comissao_percentual,
      false, 'Limite de usos atingido'::TEXT;
    RETURN;
  END IF;

  -- Cupom válido
  RETURN QUERY SELECT 
    v_cupom.id, v_cupom.afiliado_id, v_cupom.afiliado_nome, 
    v_cupom.tipo_desconto, v_cupom.valor_desconto, v_cupom.comissao_percentual,
    true, 'Cupom válido'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;