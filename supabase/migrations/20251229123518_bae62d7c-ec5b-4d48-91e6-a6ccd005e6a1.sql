-- Adicionar coluna para controlar aceite de termos de uso
ALTER TABLE public.profiles 
ADD COLUMN termos_aceitos_em TIMESTAMP WITH TIME ZONE DEFAULT NULL;