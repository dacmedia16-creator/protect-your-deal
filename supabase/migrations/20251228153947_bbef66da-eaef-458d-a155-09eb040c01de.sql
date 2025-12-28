-- Adicionar coluna asaas_plan_id na tabela planos
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS asaas_plan_id text;

-- Adicionar colunas do Asaas na tabela assinaturas (já existem stripe_customer_id e stripe_subscription_id, vamos reutilizar ou adicionar novas)
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS asaas_customer_id text;
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS asaas_subscription_id text;