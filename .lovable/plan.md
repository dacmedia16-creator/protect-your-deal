

# Auditoria Arquitetural e de Segurança — VisitaProva

---

## Resumo Executivo

O projeto é um SaaS multi-tenant maduro com 51 Edge Functions, ~165 migrations, 5 roles distintos e isolamento via RLS. A base de segurança é sólida (RLS com SECURITY DEFINER, audit trails, timing-safe no webhook de pagamento), mas há inconsistências na padronização de auth nas Edge Functions e riscos de configuração que precisam de atenção.

---

## O Que Está Bom

1. **RLS bem desenhado**: `has_role()` como SECURITY DEFINER evita recursão; todas as tabelas visíveis têm RLS habilitado
2. **Audit trail imutável**: triggers automáticos em `fichas_visita` (INSERT/UPDATE/DELETE), sem policies de UPDATE/DELETE em `audit_logs`
3. **Webhook Asaas com timing-safe comparison** e validação de token no header
4. **Helper `_shared/auth.ts`** centralizado com `requireAuth`, `requireRole`, `requireAnyRole`
5. **Roles em tabela separada** (`user_roles`) com `imobiliaria_id` e `construtora_id` para scoping multi-tenant
6. **Session tracking** com cálculo de duração via trigger
7. **Documentação de segurança** existente (`docs/edge-functions-security.md`, `docs/monitoring-queries.md`)
8. **Proteção de rotas no frontend** via `ProtectedRoute` com validação de role, assinatura e termos
9. **Feature flags** por imobiliária e construtora
10. **Logs em múltiplas camadas**: `whatsapp_logs`, `email_logs`, `webhook_logs`, `audit_logs`

---

## Riscos Encontrados

### Risco ALTO

| # | Achado | Impacto |
|---|--------|---------|
| 1 | **`.env` não está no `.gitignore`** — versionado no repositório | Chaves públicas (anon key), mas normaliza um padrão perigoso e expõe project ref |
| 2 | **master-login usa comparação simples de string** (`!== MASTER_PASSWORD`) | Vulnerável a timing attack para inferir a senha caractere a caractere |
| 3 | **CORS `Access-Control-Allow-Origin: *` em TODAS as 51 functions** | Qualquer site pode fazer requests autenticados (com cookies/tokens) para suas APIs |
| 4 | **42 de 51 functions NÃO usam `_shared/auth.ts`** | Auth ad-hoc inconsistente — cada function reimplementa validação de forma diferente |
| 5 | **Webhook Asaas sem idempotência explícita** | Se Asaas reenviar evento, pode duplicar atualizações de assinatura e comissões |

### Risco MÉDIO

| # | Achado | Impacto |
|---|--------|---------|
| 6 | **28 functions com `verify_jwt = false`** | Superfície pública ampla — todas precisam de proteção alternativa documentada |
| 7 | **`IMPERSONATION_PREFIX` ofuscado no frontend** (`authConstants.ts`) | Segurança por obscuridade — decodificável trivialmente (`String.fromCharCode(109,97,115,116,101,114,58)` = `master:`) |
| 8 | **`send-whatsapp` com `verify_jwt = false`** sem auth gate visível | Precisa validação manual — se não tem auth interna, qualquer um pode enviar mensagens |
| 9 | **Páginas monolíticas** (DetalhesFicha 2559L, AdminUsuarios 1470L, NovaFicha 1381L) | Risco alto de regressão em manutenção, difícil de testar |
| 10 | **0 testes automatizados** | Qualquer mudança pode quebrar produção sem detecção |
| 11 | **Rate limit do master-login é in-memory** | Reseta quando o Deno isolate recicla (tipicamente a cada poucos minutos de inatividade) |

### Risco BAIXO

| # | Achado | Impacto |
|---|--------|---------|
| 12 | **`gerar-codigo-indicacao` com `verify_jwt=false`** mas tem auth interna | Funcional, porém não valida role — qualquer autenticado pode gerar códigos de indicação |
| 13 | **`send-otp` com `verify_jwt=true`** mas sem validação de role | Qualquer autenticado pode disparar OTP — provavelmente intencional, mas vale documentar |
| 14 | **Ausência de camada de services/hooks** entre pages e Supabase | Lógica de negócio acoplada diretamente às páginas |

---

## Hipóteses sobre a Arquitetura Atual

1. O `.env` contém apenas chaves públicas (anon key + URL) — confirmado pela leitura do arquivo. Não há secrets server-side nele.
2. As 9 functions que usam `_shared/auth.ts` foram migradas em lotes documentados. As 42 restantes usam auth inline funcional, mas não padronizada.
3. O `send-whatsapp` provavelmente é chamado apenas por outras Edge Functions (server-to-server com service_role), não diretamente pelo frontend — **precisa validação manual**.
4. O `generate-pdf` tem auth gate interno que aceita JWT de usuário OU service_role key — padrão funcional.
5. As policies de `fichas_visita` cobrem todos os cenários multi-tenant (corretor próprio, parceiro, líder de equipe, admin de imobiliária, admin de construtora, super_admin).

---

## Plano de Implementação em Fases

### Fase 1 — Correções Críticas de Segurança (1-2 dias)

| Item | Risco que resolve | Pode quebrar algo? | Esforço |
|------|-------------------|---------------------|---------|
| Adicionar `.env` ao `.gitignore` | #1 | Não — Lovable Cloud injeta automaticamente | 5min |
| Rotacionar `MASTER_PASSWORD` no painel de secrets | #1 (preventivo) | Não | 10min |
| Implementar timing-safe comparison no `master-login` (igual ao padrão já usado no `asaas-webhook`) | #2 | Não | 30min |
| Adicionar check de idempotência no `asaas-webhook` (verificar `payment.id` duplicado em `webhook_logs` antes de processar) | #5 | Não — apenas evita reprocessamento | 1h |

### Fase 2 — Hardening de Autorização e Multi-tenant (1-2 semanas)

| Item | O que resolve | Pode quebrar algo? | Esforço |
|------|--------------|---------------------|---------|
| Criar `_shared/cors.ts` com origins restritos (`visitaprova.com.br`, `*.lovable.app`) | #3 | Sim — se houver frontend em domínio não listado | 2h |
| Migrar functions de pagamento para `_shared/auth.ts`: `asaas-create-customer`, `asaas-create-subscription`, `asaas-payment-link`, `asaas-cancel-subscription` | #4 | Baixo — mantém mesma lógica, padroniza | 3h |
| Migrar functions de operação para `_shared/auth.ts`: `admin-update-user`, `admin-vincular-usuario`, `admin-fix-inconsistencies`, `admin-criar-acesso-afiliado` | #4 | Baixo | 3h |
| Migrar functions com auth interna: `send-email`, `generate-pdf`, `create-survey`, `enviar-convite-parceiro`, `empresa-delete-corretor`, `regenerate-backup`, `generate-marketing-image` | #4 | Baixo | 4h |
| Validar e documentar auth do `send-whatsapp` | #8 | Não | 30min |
| Mover `IMPERSONATION_PREFIX` para lógica server-side (verificar no master-login, não no frontend) | #7 | Mudança no Auth.tsx — testar login normal e impersonação | 1h |

### Fase 3 — Organização de Código e Rotas (2-4 semanas)

| Item | O que resolve | Pode quebrar algo? | Esforço |
|------|--------------|---------------------|---------|
| Decompor `DetalhesFicha.tsx` (2559L) em sub-componentes + hooks | #9 | Médio — testar todas as interações | 6h |
| Decompor `NovaFicha.tsx` (1381L) e `AdminUsuarios.tsx` (1470L) | #9 | Médio | 6h |
| Extrair system prompt do `chat-assistente` para arquivo separado | Manutenibilidade | Não | 30min |
| Decompor `generate-pdf` (972L) em módulos (layout, auth, storage) | Manutenibilidade | Baixo | 3h |

### Fase 4 — Observabilidade, Testes e Manutenção (contínuo)

| Item | O que resolve | Esforço |
|------|--------------|---------|
| Converter `tests/rls-multi-tenant-test.sql` em pgTAP automatizado | #10 | 4h |
| Criar testes E2E Playwright: login, redirect por role, logout | #10 | 4h |
| Testes de integração para `verify-otp`, `asaas-webhook`, `master-login` | #10 | 4h |
| Tabela `edge_function_errors` ou integração com logs centralizados | Visibilidade operacional | 4h |

---

## Primeiras Mudanças Recomendadas (Fase 1)

1. **Adicionar `.env` ao `.gitignore`** — 1 linha, zero risco
2. **Timing-safe no `master-login`** — copiar exatamente o padrão do `asaas-webhook` (linhas 82-107)
3. **Idempotência no `asaas-webhook`** — antes de processar, query `webhook_logs` por `event.id`; se já existe com `processed = true`, retornar 200 sem reprocessar
4. **Rotacionar `MASTER_PASSWORD`** — trocar o valor no painel de secrets

Essas 4 mudanças são isoladas, não quebram nada e reduzem os riscos mais graves imediatamente.

---

Quer que eu implemente a Fase 1?

