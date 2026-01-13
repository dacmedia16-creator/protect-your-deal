-- Add commission toggle column to afiliados table
ALTER TABLE afiliados 
ADD COLUMN comissao_ativa boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN afiliados.comissao_ativa IS 
  'Define se o afiliado recebe comissão em novos pagamentos. Diferente de ativo que controla acesso ao painel.';