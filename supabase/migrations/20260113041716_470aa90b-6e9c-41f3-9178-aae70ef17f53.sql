-- Criar planos para pessoa jurídica individual (MEI/pequenas empresas)
-- Plano Gratuito para CNPJ (individual)
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
  'Gratuito CNPJ',
  'Plano gratuito para MEI e pequenas empresas começarem',
  1,
  3,
  10,
  5,
  0,
  'cnpj_individual',
  true
);

-- Plano Profissional para CNPJ (individual)
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
  'Profissional CNPJ',
  'Para empresas que precisam de mais recursos e registros',
  1,
  30,
  100,
  100,
  79.90,
  'cnpj_individual',
  true
);