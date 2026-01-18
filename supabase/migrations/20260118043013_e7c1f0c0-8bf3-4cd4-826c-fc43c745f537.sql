-- =====================================================
-- Tabela para registrar uso de fichas permanentemente
-- (não pode ser deletada pelo usuário)
-- =====================================================

CREATE TABLE public.ficha_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID NOT NULL,
  user_id UUID NOT NULL,
  imobiliaria_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas eficientes por mês
CREATE INDEX idx_ficha_usage_log_imobiliaria_mes 
ON public.ficha_usage_log(imobiliaria_id, created_at);

CREATE INDEX idx_ficha_usage_log_user_mes 
ON public.ficha_usage_log(user_id, created_at);

-- Habilitar RLS
ALTER TABLE public.ficha_usage_log ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seu próprio log (mas NÃO deletar/inserir/atualizar)
CREATE POLICY "Usuários podem ver seu próprio log de uso"
ON public.ficha_usage_log FOR SELECT
USING (auth.uid() = user_id);

-- Política: admins da imobiliária podem ver logs da imobiliária
CREATE POLICY "Admins podem ver log da imobiliaria"
ON public.ficha_usage_log FOR SELECT
USING (
  imobiliaria_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND imobiliaria_id = ficha_usage_log.imobiliaria_id
      AND role IN ('imobiliaria_admin', 'super_admin')
  )
);

-- =====================================================
-- Função que registra cada ficha criada
-- =====================================================

CREATE OR REPLACE FUNCTION log_ficha_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ficha_usage_log (ficha_id, user_id, imobiliaria_id, created_at)
  VALUES (NEW.id, NEW.user_id, NEW.imobiliaria_id, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger que dispara após inserção de ficha
CREATE TRIGGER trigger_log_ficha_usage
AFTER INSERT ON public.fichas_visita
FOR EACH ROW EXECUTE FUNCTION log_ficha_usage();

-- =====================================================
-- Atualizar função check_plan_limits para contar do log
-- =====================================================

CREATE OR REPLACE FUNCTION check_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_imobiliaria_id UUID;
  v_user_id UUID;
  v_plano_id UUID;
  v_max_fichas_mes INTEGER;
  v_fichas_mes_atual INTEGER;
BEGIN
  -- Determinar imobiliaria_id e user_id
  v_imobiliaria_id := NEW.imobiliaria_id;
  v_user_id := NEW.user_id;
  
  -- Buscar assinatura e limites do plano
  IF v_imobiliaria_id IS NOT NULL THEN
    SELECT a.plano_id INTO v_plano_id
    FROM public.assinaturas a
    WHERE a.imobiliaria_id = v_imobiliaria_id 
      AND a.status = 'ativa'
    ORDER BY a.created_at DESC
    LIMIT 1;
  ELSE
    -- Corretor autônomo
    SELECT a.plano_id INTO v_plano_id
    FROM public.assinaturas a
    WHERE a.user_id = v_user_id 
      AND a.imobiliaria_id IS NULL
      AND a.status = 'ativa'
    ORDER BY a.created_at DESC
    LIMIT 1;
  END IF;
  
  -- Se não tem assinatura ativa, bloquear
  IF v_plano_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura inativa ou inexistente. Contrate um plano para continuar.';
  END IF;
  
  -- Buscar limite do plano
  SELECT max_fichas_mes INTO v_max_fichas_mes
  FROM public.planos WHERE id = v_plano_id;
  
  -- Se não encontrou o plano (dados inconsistentes), permitir por segurança
  IF v_max_fichas_mes IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- MUDANÇA: Contar fichas do log de uso (não da tabela de fichas)
  -- Isso garante que fichas deletadas continuem contando no limite
  IF v_imobiliaria_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_fichas_mes_atual
    FROM public.ficha_usage_log
    WHERE imobiliaria_id = v_imobiliaria_id
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);
  ELSE
    SELECT COUNT(*) INTO v_fichas_mes_atual
    FROM public.ficha_usage_log
    WHERE user_id = v_user_id 
      AND imobiliaria_id IS NULL
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);
  END IF;
  
  -- Verificar limite
  IF v_fichas_mes_atual >= v_max_fichas_mes THEN
    RAISE EXCEPTION 'Limite de % fichas/mês atingido. Faça upgrade do seu plano para continuar.', v_max_fichas_mes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Migrar fichas existentes do mês atual para o log
-- =====================================================

INSERT INTO public.ficha_usage_log (ficha_id, user_id, imobiliaria_id, created_at)
SELECT id, user_id, imobiliaria_id, created_at
FROM public.fichas_visita
WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;