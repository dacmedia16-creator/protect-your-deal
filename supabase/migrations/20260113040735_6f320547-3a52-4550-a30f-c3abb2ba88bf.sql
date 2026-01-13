-- Criar plano pago para corretores autônomos (CPF)
INSERT INTO planos (
  nome,
  descricao,
  max_corretores,
  max_fichas_mes,
  max_clientes,
  max_imoveis,
  valor_mensal,
  tipo_cadastro,
  ativo
) VALUES (
  'Profissional',
  'Para corretores autônomos que precisam de mais recursos e registros ilimitados',
  1,
  30,
  100,
  100,
  49.90,
  'cpf',
  true
);