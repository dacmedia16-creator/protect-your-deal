-- Adicionar coluna para indicar o tipo de localização obtida (gps ou ip)
ALTER TABLE public.confirmacoes_otp 
ADD COLUMN aceite_localizacao_tipo text DEFAULT NULL;