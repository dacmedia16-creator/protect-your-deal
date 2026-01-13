-- Insert configuration for affiliate commission month limit
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES 
  ('limite_meses_comissao_ativo', 'false', 'Ativa/desativa limite de meses para comissão recorrente de afiliados'),
  ('limite_meses_comissao_valor', '12', 'Número máximo de meses para pagamento de comissão recorrente')
ON CONFLICT (chave) DO NOTHING;