-- Corrigir a função check_plan_limits para ter search_path definido
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
  
  -- Contar fichas do mês atual
  IF v_imobiliaria_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_fichas_mes_atual
    FROM public.fichas_visita
    WHERE imobiliaria_id = v_imobiliaria_id
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);
  ELSE
    SELECT COUNT(*) INTO v_fichas_mes_atual
    FROM public.fichas_visita
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