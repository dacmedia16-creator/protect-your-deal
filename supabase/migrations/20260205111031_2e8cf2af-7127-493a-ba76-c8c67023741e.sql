-- Limpeza do usuário órfão: Fernanda a souza (15981888214)
-- user_id: b0e6b18e-decf-4994-9293-9e192490b15b

DO $$
DECLARE
  target_user_id UUID := 'b0e6b18e-decf-4994-9293-9e192490b15b';
BEGIN
  -- 1. Limpar referências em equipes_membros (se houver)
  DELETE FROM equipes_membros WHERE user_id = target_user_id;
  
  -- 2. Limpar referências em otp_queue (se houver)
  DELETE FROM otp_queue WHERE user_id = target_user_id;
  
  -- 3. Limpar referências em afiliados (se houver)
  DELETE FROM afiliados WHERE user_id = target_user_id;
  
  -- 4. Limpar referências em templates_mensagem (se houver)
  DELETE FROM templates_mensagem WHERE user_id = target_user_id;
  
  -- 5. Nullificar user_id em audit_logs (preservar histórico)
  UPDATE audit_logs SET user_id = NULL WHERE user_id = target_user_id;
  
  -- 6. Limpar referências em fichas_visita (user_id e corretor_parceiro_id)
  UPDATE fichas_visita SET user_id = NULL WHERE user_id = target_user_id;
  UPDATE fichas_visita SET corretor_parceiro_id = NULL WHERE corretor_parceiro_id = target_user_id;
  
  -- 7. Limpar referências em surveys
  DELETE FROM surveys WHERE corretor_id = target_user_id;
  
  -- 8. Limpar referências em ficha_usage_log
  DELETE FROM ficha_usage_log WHERE user_id = target_user_id;
  
  -- 9. Limpar referências em user_feature_flags
  DELETE FROM user_feature_flags WHERE user_id = target_user_id;
  
  -- 10. Limpar referências em assinaturas
  DELETE FROM assinaturas WHERE user_id = target_user_id;
  
  -- 11. Limpar referências em convites_parceiro
  DELETE FROM convites_parceiro WHERE corretor_origem_id = target_user_id;
  UPDATE convites_parceiro SET corretor_parceiro_id = NULL WHERE corretor_parceiro_id = target_user_id;
  
  -- 12. Limpar referências em user_roles (já não existe, mas por segurança)
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- 13. Finalmente, excluir o perfil (libera o telefone)
  DELETE FROM profiles WHERE user_id = target_user_id;
  
  RAISE NOTICE 'Usuário Fernanda a souza (15981888214) removido com sucesso!';
END $$;