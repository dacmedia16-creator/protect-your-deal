ALTER TABLE public.assinaturas DROP CONSTRAINT chk_assinatura_owner;

ALTER TABLE public.assinaturas
ADD CONSTRAINT chk_assinatura_owner CHECK (
  (imobiliaria_id IS NOT NULL AND user_id IS NULL AND construtora_id IS NULL) OR
  (imobiliaria_id IS NULL AND user_id IS NOT NULL AND construtora_id IS NULL) OR
  (imobiliaria_id IS NULL AND user_id IS NULL AND construtora_id IS NOT NULL)
);