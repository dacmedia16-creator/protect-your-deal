UPDATE public.assinaturas 
SET status = 'ativa', 
    asaas_subscription_id = 'sub_3f69nz8pp11gohqs',
    plano_id = 'a988b889-a095-428d-9d0b-5f6779d0311e',
    plano_pendente_id = NULL,
    proxima_cobranca = (CURRENT_DATE + INTERVAL '30 days')::date,
    updated_at = now()
WHERE id = '5c7b4f93-1fce-4b88-9c50-560972619a1a';