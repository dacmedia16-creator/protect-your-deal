-- Função para incrementar o contador de usos do cupom
CREATE OR REPLACE FUNCTION public.increment_cupom_usos(cupom_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.cupons 
  SET usos_atuais = usos_atuais + 1
  WHERE id = cupom_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;