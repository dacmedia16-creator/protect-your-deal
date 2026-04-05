# Edge Functions — Segurança e Autenticação

Este documento registra quais Edge Functions possuem `verify_jwt = false` e por quê.

## Princípio

Funções com `verify_jwt = false` não validam o JWT automaticamente no gateway do Supabase. Cada função deve ter uma proteção alternativa documentada abaixo.

---

## Funções Públicas (verify_jwt = false) — Justificativa

| Função | Motivo público | Proteção substituta |
|--------|---------------|---------------------|
| `verify-otp` | Endpoint acessado por clientes sem conta via link no WhatsApp | Token único + código OTP + CPF + limite de tentativas |
| `get-otp-info` | Leitura de status do OTP por token público | Apenas retorna status, sem dados sensíveis |
| `asaas-webhook` | Webhook chamado pelo gateway de pagamento Asaas | Timing-safe comparison do token no header |
| `asaas-webhook-test` | Teste de webhook (produção) | Apenas leitura de logs |
| `get-ficha-externa` | Acesso de corretor parceiro via token no WhatsApp | Token único + filtragem de PII |
| `submit-survey-response` | Resposta de pesquisa por cliente via link público | Token único de survey |
| `get-survey-by-token` | Leitura de pesquisa por token público | Token único |
| `verify-comprovante` | Verificação pública de comprovante por protocolo | Sem dados sensíveis (apenas validade) |
| `verify-pdf-integrity` | Verificação de hash do PDF | Sem dados sensíveis |
| `registro-imobiliaria` | Registro público de conta | Cria conta (sem acesso a dados existentes) |
| `registro-corretor-autonomo` | Registro público de conta | Cria conta (sem acesso a dados existentes) |
| `registro-construtora` | Registro público de conta | Cria conta |
| `master-login` | Login administrativo de suporte | Rate-limit por IP (5 req/min) + timing-safe comparison de secret server-side |
| `app-version` | Leitura pública de versão do app | Apenas versão, sem dados sensíveis |
| `otp-reminder` | Lembrete automático de OTP pendente | Chamado por cron, sem entrada do usuário |
| `process-otp-queue` | Processamento da fila de OTP | Chamado por cron |
| `survey-og-page` | Meta tags para redes sociais | Apenas HTML estático |
| `aceitar-convite-externo` | Aceite de convite por corretor externo | Token único |

## Funções com verify_jwt = false MAS com auth interna

| Função | Auth interna |
|--------|-------------|
| `send-email` | Bearer token + role check (super_admin ou imobiliaria_admin) + bypass via SERVICE_ROLE_KEY |
| `create-survey` | Bearer token validation |
| `gerar-codigo-indicacao` | Bearer + getUser validation |
| `chat-assistente` | Rate-limit por IP (5 req/min anon, 20 req/min auth) + token budget por hora |

## Funções com verify_jwt = true

Todas as demais funções exigem JWT válido no gateway. Inclui:
- `admin-*` (todas as funções administrativas)
- `asaas-create-*`, `asaas-cancel-*` (operações de pagamento)
- `enviar-convite-parceiro`, `aceitar-convite-parceiro`
- `empresa-delete-corretor`
- `regenerate-backup`
- `generate-marketing-image`
- `register-version`
- `send-otp`

---

## Helper padronizado: `_shared/auth.ts`

Funções admin migradas para usar o helper centralizado:

| Função | Helper usado | Lote |
|--------|-------------|------|
| `admin-reset-password` | `requireRole("super_admin")` | Lote 2 |
| `admin-delete-user` | `requireRole("super_admin")` | Lote 2 |
| `admin-get-corretores-emails` | `requireAnyRole(["imobiliaria_admin", "super_admin"])` | Lote 3 |
| `admin-reset-corretor-password` | `requireAnyRole(["super_admin", "imobiliaria_admin", "construtora_admin"])` | Lote 3 |
| `admin-update-corretor` | `requireAnyRole(["super_admin", "imobiliaria_admin", "construtora_admin"])` + fallback líder via `requireAuth` | Lote 3 |
| `admin-create-user` | `requireRole("super_admin")` | Lote 4 |
| `admin-promote-corretor` | `requireAnyRole(["super_admin", "imobiliaria_admin", "construtora_admin"])` | Lote 4 |
| `admin-create-corretor` | `requireAnyRole(["imobiliaria_admin", "super_admin", "construtora_admin"])` | Lote 4 |

---

*Última atualização: 2026-04-05*
