

# Batch 2 — Plano Final de Rollout

## 1. Ordem final de deploy

```text
Deploy 1:  2.1 — admin-reset-password → _shared/auth.ts
Deploy 2:  2.2 — admin-delete-user → _shared/auth.ts
Deploy 3:  2.3a — migração: criar tabela whatsapp_logs + RLS
Deploy 4:  2.3b — atualizar send-whatsapp com INSERT em whatsapp_logs
Deploy 5:  2.4 — documentar queries de monitoramento (plan.md/docs)
```

## 2. Agrupamento

| Pode agrupar? | Itens | Justificativa |
|---|---|---|
| **Não** | 2.1 + 2.2 | Mesma natureza, mas se 2.1 causar regressão silenciosa, 2.2 amplifica. Validar 2.1 antes. |
| **Não** | 2.3a + 2.3b | Tabela deve existir antes da função inserir nela. Ordem obrigatória. |
| **Sim** | 2.4 com qualquer outro | Documentação pura, sem risco. Pode ir junto com 2.3b. |

## 3. Item mais sensível

**2.3b (INSERT em send-whatsapp)** — três razões:

1. `send-whatsapp` é a função mais chamada do sistema (OTP, notificações, admin bulk). Qualquer regressão impacta operação imediata.
2. Se o INSERT falhar e não estiver em try/catch isolado, bloqueia envio de mensagens.
3. Diferente de 2.1/2.2 (que só mudam o gate de auth), 2.3b adiciona lógica nova ao corpo da função.

## 4. Checklist de validação manual

### Após Deploy 1 (admin-reset-password)
- [ ] Super admin: set_password funciona
- [ ] Super admin: send_reset_email funciona
- [ ] Corretor comum: retorna 403
- [ ] Sem token: retorna 401
- [ ] Auto-reset (próprio ID): retorna 400

### Após Deploy 2 (admin-delete-user)
- [ ] Super admin: exclusão de corretor funciona
- [ ] imobiliaria_admin: retorna 403
- [ ] Auto-exclusão: retorna 400
- [ ] Exclusão de outro super_admin: retorna 403
- [ ] Fichas do usuário excluído foram transferidas/orphanadas

### Após Deploy 3 (tabela whatsapp_logs)
- [ ] `SELECT * FROM whatsapp_logs LIMIT 1` executa sem erro
- [ ] Corretor comum não consegue ler (RLS)
- [ ] Super admin consegue ler (RLS)

### Após Deploy 4 (send-whatsapp com log)
- [ ] Enviar mensagem WhatsApp via admin → registro aparece em whatsapp_logs
- [ ] Envio com telefone inválido → registro com status='failed'
- [ ] Envio normal continua funcionando (tempo de resposta similar)
- [ ] OTP via send-whatsapp (service_role) → registro aparece

### Após Deploy 5 (documentação)
- [ ] Queries documentadas executam sem erro SQL

## 5. Rollback por item

| Item | Rollback |
|---|---|
| 2.1 | Reverter `admin-reset-password/index.ts` ao código anterior (inline auth). Redeploy. Sem mudança de banco. |
| 2.2 | Reverter `admin-delete-user/index.ts` ao código anterior. Redeploy. Sem mudança de banco. |
| 2.3a | Tabela vazia pode permanecer. Se necessário: `DROP TABLE whatsapp_logs`. |
| 2.3b | Reverter `send-whatsapp/index.ts` removendo o bloco de INSERT. Redeploy. Tabela fica inerte. |
| 2.4 | Reverter arquivo de docs. Sem impacto técnico. |

## 6. Monitoramento pós-deploy (primeiras 2h)

| Deploy | O que monitorar |
|---|---|
| 2.1 | Logs de `admin-reset-password` — qualquer 500 ou 401 inesperado |
| 2.2 | Logs de `admin-delete-user` — qualquer 500. Confirmar que cascade de deleção completa sem erro |
| 2.3b | **Crítico**: (1) Tempo de resposta do `send-whatsapp` não aumentou >500ms. (2) Nenhum envio falhou por erro de INSERT. (3) `SELECT count(*) FROM whatsapp_logs` cresce conforme uso. |

## 7. Critério de conclusão do Batch 2

O Batch 2 está concluído quando **todos** estes são verdadeiros:

1. `admin-reset-password` e `admin-delete-user` não contêm `createClient` local para auth
2. `whatsapp_logs` tem registros reais de pelo menos 24h de operação
3. Nenhum registro em `whatsapp_logs` indica falha de INSERT (verificar logs do edge function)
4. Queries de monitoramento estão documentadas e executáveis
5. Nenhuma regressão reportada por usuários em 48h após último deploy

---

**Sequência recomendada de tempo**: um deploy por dia útil. 2.1 na segunda, 2.2 na terça, 2.3a na quarta, 2.3b na quinta, 2.4 na sexta. Batch fechado na semana seguinte após 48h de estabilidade.

