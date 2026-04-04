

# Refinamento Operacional — Plano Pós-Release VisitaProva

---

## 1. Ordem final de execução

```text
IMEDIATO (regra de processo, sem batch)
  Gate: toda nova Edge Function usa _shared/auth.ts
  Gate: toda nova tabela tem RLS + trigger de audit

BATCH 1 — Validação estrutural
  1.1  Script SQL de teste RLS multi-tenant
  1.2  Migrar admin-list-users para _shared/auth.ts

BATCH 2 — Rastreabilidade + padronização
  2.1  Log persistente de envios WhatsApp em send-whatsapp
  2.2  Migrar 3 funções admin para _shared/auth.ts
       (admin-get-corretores-emails, admin-reset-password, admin-delete-user)
  2.3  Query de monitoramento semanal documentada

BATCH 3 — Defesa em profundidade
  3.1  CORS restritivo nas funções com verify_jwt = true
  3.2  Migrar funções restantes (admin-create-user, admin-update-user, etc.)
  3.3  Documentar processo de build Capacitor
```

---

## 2. Conteúdo de cada batch

### Batch 1 — Validação estrutural

| Item | Detalhe |
|------|---------|
| 1.1 Script RLS | SQL que simula 3 contextos (corretor_A/imob_1, corretor_B/imob_2, admin_1/imob_1) via `SET LOCAL ROLE authenticated` + `request.jwt.claims`. Testa SELECT em `fichas_visita`, `clientes`, `imoveis`, `surveys`. Testa INSERT em `audit_logs` com `action='VIEW'` (deve funcionar) e `action='UPDATE'` (deve falhar). Tudo em transação com ROLLBACK. |
| 1.2 Migrar `admin-list-users` | Substituir linhas 14-66 (auth manual + role check) por `const result = await requireRole(req, 'super_admin'); if (result instanceof Response) return result;`. Primeira prova de conceito do helper. |

### Batch 2 — Rastreabilidade + padronização

| Item | Detalhe |
|------|---------|
| 2.1 WhatsApp logs | Criar tabela `whatsapp_logs` (phone, template, status, error, ficha_id, user_id, created_at) com RLS: INSERT para service_role, SELECT para super_admin + imobiliaria_admin. Inserir registro em `send-whatsapp` após cada envio (sucesso ou falha). |
| 2.2 Migrar 3 funções | Mesmo padrão do 1.2: substituir bloco de auth manual por `requireRole`. Funções simples com padrão idêntico ao `admin-list-users`. |
| 2.3 Monitoramento | Documentar queries: `SELECT * FROM audit_logs WHERE action IN ('IMPERSONATE','DELETE') ORDER BY created_at DESC LIMIT 20` e equivalente para `webhook_logs` com `processed = false`. |

### Batch 3 — Defesa em profundidade

| Item | Detalhe |
|------|---------|
| 3.1 CORS | Criar helper `getAllowedOrigin(req)` no `_shared/auth.ts`. Domínios: `visitaprova.com.br`, `protect-your-deal.lovable.app`, `*.lovable.app`. Aplicar em funções com `verify_jwt = true`. Funções públicas mantêm `*`. |
| 3.2 Migrações restantes | `admin-create-user`, `admin-update-user`, `admin-promote-corretor`, `admin-update-corretor`, `send-email`, `create-survey`. 1 por vez. |
| 3.3 Capacitor | Documentar `npm run build → npx cap sync → build nativo`. Não criar pipeline agora. |

---

## 3. O que começa imediatamente como regra de processo

Antes de qualquer batch, dois gates entram em vigor:

- **Gate 1**: toda nova Edge Function DEVE importar de `_shared/auth.ts`. Sem exceção.
- **Gate 2**: toda nova tabela com dados sensíveis DEVE ter RLS ativado + trigger de audit.
- **Gate 3**: toda nova função autenticada DEVE usar CORS restritivo (após Batch 3 estar pronto, usar `getAllowedOrigin`).

Esses gates não exigem código — são regras de processo para qualquer mudança futura.

---

## 4. Critério de pronto para cada batch

| Batch | Critério |
|-------|----------|
| 1 | Script RLS executa com PASS em todas assertions (isolamento confirmado entre 3 tenants). `admin-list-users` usa `requireRole` e retorna lista de usuários corretamente. |
| 2 | Envio de WhatsApp gera registro em `whatsapp_logs` consultável. 4 funções admin total usando `_shared/auth.ts`. Queries de monitoramento documentadas no `plan.md`. |
| 3 | Funções com `verify_jwt = true` rejeitam `Origin` desconhecido (testar com `curl -H "Origin: https://evil.com"`). 80%+ das funções admin migradas. Processo Capacitor documentado. |

---

## 5. O que testar após cada batch

### Após Batch 1
- [ ] Script RLS reporta PASS para isolamento em `fichas_visita`, `clientes`, `imoveis`
- [ ] `admin-list-users` continua retornando usuários para super_admin
- [ ] `admin-list-users` retorna 403 para não-admin
- [ ] Nenhuma regressão nos fluxos existentes (login, criação de ficha, OTP)

### Após Batch 2
- [ ] Enviar WhatsApp via admin → registro aparece em `whatsapp_logs`
- [ ] OTP via `send-whatsapp` (chamada interna) → registro aparece em `whatsapp_logs`
- [ ] Funções migradas continuam funcionando (testar cada uma)
- [ ] Query de monitoramento retorna dados de `audit_logs` e `webhook_logs`

### Após Batch 3
- [ ] `curl` com `Origin: https://evil.com` para função admin → rejeitado
- [ ] `curl` com `Origin: https://visitaprova.com.br` → aceito
- [ ] Funções públicas (verify-otp, webhooks) continuam acessíveis de qualquer origem
- [ ] Preview do Lovable continua funcionando (origin `*.lovable.app` permitido)

---

## 6. O que NÃO fazer cedo demais

| Ação prematura | Por quê esperar |
|----------------|-----------------|
| Migrar `master-login` para `_shared/auth.ts` | Tem lógica de auth diferente (secret, não JWT). Avaliar só após Batch 2 confirmar que o helper funciona em produção. |
| Pipeline de CI/CD para Capacitor | Não há volume de builds nativos que justifique. Documentar processo manual primeiro. |
| Testes E2E automatizados | Exigem infraestrutura (Playwright + CI). Valor real só após pipeline existir. |
| Refatorar `send-whatsapp` para usar `_shared/auth.ts` | Tem lógica de service_role bypass que difere do padrão. Migrar só no Batch 3, após confirmar helper em funções simples. |
| Alertas automáticos de monitoramento | Queries manuais semanais são suficientes para o volume atual. Automatizar quando houver incidentes reais. |

---

## 7. Como evitar criar dívida nova

| Regra | Enforcement |
|-------|-------------|
| Toda nova Edge Function usa `_shared/auth.ts` | Revisar import na primeira linha antes de considerar pronto |
| Toda nova tabela tem RLS | Verificar via `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (SELECT tablename FROM pg_tables WHERE rowsecurity=true)` |
| Não duplicar padrão de auth manual | Se uma função precisa de auth, importar `requireAuth`/`requireRole` — nunca copiar o bloco de 30 linhas |
| Não criar tabela sem trigger de audit se contém PII | Regra de design: CPF, telefone, email = trigger obrigatório |
| Documentar decisões de segurança | Qualquer `verify_jwt = false` deve ter justificativa em `docs/edge-functions-security.md` |

