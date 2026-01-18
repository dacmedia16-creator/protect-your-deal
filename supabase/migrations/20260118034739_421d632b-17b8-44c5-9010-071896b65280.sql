-- Função para verificar limite de clientes do plano
CREATE OR REPLACE FUNCTION check_cliente_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_imobiliaria_id UUID;
  v_plano_id UUID;
  v_max_clientes INTEGER;
  v_clientes_atual INTEGER;
BEGIN
  v_imobiliaria_id := NEW.imobiliaria_id;
  
  -- Se não tem imobiliaria_id, permitir (corretor autônomo sem plano de clientes)
  IF v_imobiliaria_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar assinatura ativa
  SELECT a.plano_id INTO v_plano_id
  FROM public.assinaturas a
  WHERE a.imobiliaria_id = v_imobiliaria_id 
    AND a.status = 'ativa'
  ORDER BY a.created_at DESC
  LIMIT 1;
  
  IF v_plano_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura inativa ou inexistente.';
  END IF;
  
  -- Buscar limite do plano
  SELECT max_clientes INTO v_max_clientes
  FROM public.planos WHERE id = v_plano_id;
  
  IF v_max_clientes IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar clientes atuais
  SELECT COUNT(*) INTO v_clientes_atual
  FROM public.clientes
  WHERE imobiliaria_id = v_imobiliaria_id;
  
  -- Verificar limite
  IF v_clientes_atual >= v_max_clientes THEN
    RAISE EXCEPTION 'Limite de % clientes atingido. Faça upgrade do seu plano.', v_max_clientes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_cliente_limits_trigger
  BEFORE INSERT ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION check_cliente_limits();

-- Função para verificar limite de imóveis do plano
CREATE OR REPLACE FUNCTION check_imovel_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_imobiliaria_id UUID;
  v_plano_id UUID;
  v_max_imoveis INTEGER;
  v_imoveis_atual INTEGER;
BEGIN
  v_imobiliaria_id := NEW.imobiliaria_id;
  
  -- Se não tem imobiliaria_id, permitir (corretor autônomo sem plano de imóveis)
  IF v_imobiliaria_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar assinatura ativa
  SELECT a.plano_id INTO v_plano_id
  FROM public.assinaturas a
  WHERE a.imobiliaria_id = v_imobiliaria_id 
    AND a.status = 'ativa'
  ORDER BY a.created_at DESC
  LIMIT 1;
  
  IF v_plano_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura inativa ou inexistente.';
  END IF;
  
  -- Buscar limite do plano
  SELECT max_imoveis INTO v_max_imoveis
  FROM public.planos WHERE id = v_plano_id;
  
  IF v_max_imoveis IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar imóveis atuais
  SELECT COUNT(*) INTO v_imoveis_atual
  FROM public.imoveis
  WHERE imobiliaria_id = v_imobiliaria_id;
  
  -- Verificar limite
  IF v_imoveis_atual >= v_max_imoveis THEN
    RAISE EXCEPTION 'Limite de % imóveis atingido. Faça upgrade do seu plano.', v_max_imoveis;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_imovel_limits_trigger
  BEFORE INSERT ON imoveis
  FOR EACH ROW
  EXECUTE FUNCTION check_imovel_limits();