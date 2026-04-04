

# Plano de Execução Validado — VisitaProva

---

## Classificação dos Achados

### CONFIRMADO no código

| # | Achado | Evidência |
|---|--------|-----------|
| 1 | `.env` fora do `.gitignore` | `.gitignore` não contém `.env` (22 linhas, nenhuma menção) |
| 2 | `send-email` com `verify_jwt = false` | config.toml confirma. **PORÉM** o código JÁ TEM auth gate interno (linhas 132-169): valida Bearer token + verifica role `super_admin` ou `imobiliaria_admin`. Chamadas internas usam SERVICE_ROLE_KEY. **O risco da auditoria original estava ERRADO — esta função já está protegida.** |
| 3 | `chat-assistente` sem auth, apenas rate-limit por IP | Confirmado: 20 req/min por IP, sem Bearer. Qualquer pessoa pode consumir tokens de IA. |
| 4 | `seed-test-admin` no config.toml sem arquivo | Confirmado: diretório vazio, entrada fantasma no config.toml |
| 5 | `dangerouslySetInnerHTML` sem sanitização | `ConfiguracoesEmail.tsx` linha 721: `dangerouslySetInnerHTML={{ __html: previewTemplate?.conteudo_html }}` — sem DOMPurify |
| 6 | `master:` prefix exposto no Auth.tsx | Linha 236: `loginData.password.startsWith('master:')` visível no código-fonte |
| 7 | Capacitor `allowMixedContent: true` + `cleartext: true` | `capacitor.config.ts` confirma ambos |
| 8 | Capacitor aponta para URL do Lovable | `server.url` aponta para `lovableproject.com` |
| 9 | SW registrado sem guard de iframe | `main.tsx` linha 7-8: `registerSW({ immediate: true })` incondicional |
| 10 | App.tsx com 609 linhas e ~100 rotas | Confirmado |
| 11 | PDF já salva hash SHA-256 no banco | **generate-pdf já implementa `documento_hash` e `documento_gerado_em`** (linhas 937-944). O achado da auditoria original estava ERRADO. |
| 12 | `gerar-codigo-indicacao` sem auth | **ERRADO** — a função TEM auth interna (linhas 21-37): valida Bearer token + getUser. Está protegida. |

### PARCIALMENTE CONFIRMADO

| # | Achado | Status |
|---|--------|--------|
| 13 | Triggers automáticos de audit em `fichas_visita` | O `db-triggers` retorna vazio, mas existem triggers via functions (handle_new_user, log_ficha_usage, normalize_*). Não há trigger de audit para alterações em fichas após confirmação OTP. |
| 14 | Duplicação Empresa/Construtora | Provável (estrutura de páginas idêntica), mas requer leitura dos componentes para quantificar |

### CORRIGIDO PELA AUDITORIA ANTERIOR (não precisa de ação)

| # | Item | Motivo |
|---|------|--------|
| A | `send-email` sem auth | JÁ TEM auth gate interno robusto (Bearer + role check + service_role bypass) |
| B | Hash SHA-256 do PDF | JÁ IMPLEMENTADO em `generate-pdf` |
| C | `gerar-codigo-indicacao` sem auth | JÁ TEM auth interna |

---

## Funções com `verify_jwt = false` — Análise de Justificativa

| Função | Deve continuar pública? | Proteção substituta |
|--------|------------------------|---------------------|
| `verify-otp` | Sim | Token único + código OTP + CPF + limite de tentativas |
| `get-otp-info` | Sim | Apenas leitura de status por token público |
| `asaas-webhook` | Sim | Timing-safe token comparison no header |
| `get-ficha-externa` | Sim | Token único + filtragem PII |
| `submit-survey-response` | Sim | Token único de survey |
| `get-survey-by-token` | Sim | Token único |
| `verify-comprovante` | Sim | Leitura pública por protocolo (sem PII) |
| `verify-pdf-integrity` | Sim | Verificação de hash (sem dados sensíveis) |
| `registro-imobiliaria` | Sim | Registro público (cria conta) |
| `registro-corretor-autonomo` | Sim | Registro público (cria conta) |
| `master-login` | Sim | Rate-limit por IP + secret server-side |
| `app-version` | Sim | Leitura pública de versão |
| `chat-assistente` | **Não** | Rate-limit por IP é insuficiente — abuso de tokens de IA |
| `send-email` | Sim (tem auth interna) | Bearer + role check + service_role bypass |
| `create-survey` | Sim (tem auth interna) | Bearer token validation |
| `gerar-codigo-indicacao` | Sim (tem auth interna) | Bearer + getUser |
| `seed-test-admin` | **Remover** | Sem arquivo, entrada fantasma |

---

## Plano de Execução em Sprints

### Sprint 1 — Segurança Imediata (1 dia)

| # | Problema | Impacto | Esforço | Arquivo(s) | Solução |
|---|----------|---------|---------|------------|---------|
| 1 | `.env` fora do `.gitignore` | Crítico — secrets futuros serão expostos | 1 min | `.gitignore` | Adicionar `.env` e `.env.*` ao `.gitignore` |
| 2 | `chat-assistente` sem auth | Alto — abuso de tokens de IA sem limite real | 30 min | `supabase/functions/chat-assistente/index.ts` | Adicionar auth opcional: se logado, valida Bearer; se visitante, manter rate-limit mas reduzir para 5 req/min. Adicionar controle de tokens consumidos por IP. |
| 3 | `seed-test-admin` fantasma no config.toml | Alto — potencial vetor se deploy antigo existir | 2 min | `supabase/config.toml` | Remover bloco `[functions.seed-test-admin]` |
| 4 | `dangerouslySetInnerHTML` sem sanitização | Alto — XSS se admin inserir HTML malicioso | 15 min | `src/pages/ConfiguracoesEmail.tsx` | Instalar `dompurify`, sanitizar antes de renderizar |
| 5 | Capacitor `allowMixedContent` + `cleartext` | Médio — MITM em Android | 2 min | `capacitor.config.ts` | Remover `allowMixedContent: true` e `cleartext: true` |

### Sprint 2 — Trilha de Auditoria e Robustez da Prova (2-3 dias)

| # | Problema | Impacto | Esforço | Arquivo(s) | Solução |
|---|----------|---------|---------|------------|---------|
| 6 | Sem trigger de audit para alterações em `fichas_visita` | Alto — edições pós-OTP ficam invisíveis | 1h | Migration SQL | Criar trigger `AFTER UPDATE` em `fichas_visita` que insere em `audit_logs` com old/new values para campos críticos |
| 7 | Sem log de visualização de fichas | Médio — sem rastro de acesso | 1h | `src/pages/DetalhesFicha.tsx` + migration | Inserir registro em `audit_logs` ao abrir ficha (action: 'view') |
| 8 | `surveys` com 8 políticas SELECT sobrepostas | Médio — risco de permissão inesperada no futuro | 30 min | Migration SQL | Consolidar políticas redundantes |

### Sprint 3 — Modularização e Limpeza (3-5 dias)

| # | Problema | Impacto | Esforço | Arquivo(s) | Solução |
|---|----------|---------|---------|------------|---------|
| 9 | App.tsx com 609 linhas | Médio — manutenção difícil | 2h | `src/App.tsx` + novos `src/routes/*.tsx` | Extrair rotas em `adminRoutes.tsx`, `empresaRoutes.tsx`, `construtoraRoutes.tsx`, `afiliadoRoutes.tsx`, `publicRoutes.tsx`, `corretorRoutes.tsx` |
| 10 | `master:` prefix exposto | Médio — existência do backdoor é pública | 30 min | `src/pages/Auth.tsx` | Mover detecção para uma constante importada ou ofuscar o prefixo |
| 11 | SW sem guard de iframe/preview | Médio — cache desnecessário em desenvolvimento | 15 min | `src/main.tsx` | Adicionar check: `!window.frameElement && !location.search.includes('forceHideBadge')` |

### Sprint 4 — Mobile/PWA e Operação (1 semana)

| # | Problema | Impacto | Esforço | Arquivo(s) | Solução |
|---|----------|---------|---------|------------|---------|
| 12 | Capacitor aponta para URL Lovable | Alto — dependência total de infra externa | 2h+ | `capacitor.config.ts` | Migrar para `webDir: 'dist'` com build local (requer pipeline de CI/CD) |
| 13 | CORS `*` em todas as funções | Baixo-Médio | 1h | Todas Edge Functions autenticadas | Restringir `Access-Control-Allow-Origin` para `visitaprova.com.br` e `*.lovable.app` |
| 14 | Documentar funções `verify_jwt=false` | Baixo | 30 min | `docs/edge-functions-security.md` | Criar documento com justificativa para cada função pública |

---

## Resumo de Correções da Auditoria Original

A auditoria original continha **3 erros factuais** que este plano corrige:

1. **`send-email` foi classificado como CRÍTICO sem auth** → Na verdade JÁ TEM auth gate robusto (Bearer + role + service_role bypass). Não precisa de ação.
2. **"Sem hash SHA-256 do PDF"** → O `generate-pdf` JÁ salva `documento_hash` e `documento_gerado_em` no banco. Não precisa de ação.
3. **`gerar-codigo-indicacao` sem auth** → JÁ TEM validação de Bearer + getUser. Não precisa de ação.

Itens removidos do plano por já estarem resolvidos: 3. Itens reais que precisam de ação: 14.

