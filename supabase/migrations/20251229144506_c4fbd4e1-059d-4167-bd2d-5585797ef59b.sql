-- Adicionar coluna codigo (inteiro, único)
ALTER TABLE public.imobiliarias 
ADD COLUMN codigo INTEGER UNIQUE;

-- Criar função para gerar próximo código
CREATE OR REPLACE FUNCTION public.generate_imobiliaria_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    SELECT COALESCE(MAX(codigo), 99) + 1 INTO NEW.codigo 
    FROM public.imobiliarias;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para gerar código automaticamente
CREATE TRIGGER set_imobiliaria_codigo
BEFORE INSERT ON public.imobiliarias
FOR EACH ROW
EXECUTE FUNCTION public.generate_imobiliaria_codigo();

-- Popular códigos nas imobiliárias existentes (começando em 100)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM public.imobiliarias
)
UPDATE public.imobiliarias 
SET codigo = 99 + numbered.row_number
FROM numbered
WHERE public.imobiliarias.id = numbered.id;