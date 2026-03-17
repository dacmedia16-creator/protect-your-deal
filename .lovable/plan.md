

## Auditoria de Segurança: Edge Functions com `verify_jwt = false`

### Funções com `verify_jwt = false` (20 total)

Classifico cada uma por nível de risco:

---

### CRÍTICO — Podem ser exploradas para causar dano real

| Função | Risco | Problema |
|--------|-------|----------|
| **`send-whatsapp`** | ✅ JÁ CORRIGIDO | Auth gate adicionado no código |
| **`send-email`** | **CRÍTICO** | Sem verificação de auth. Qualquer pessoa pode enviar emails usando as credenciais SMTP do sistema (Zoho). Pode enviar spam, phishing, ou se passar pelo suporte |
| **`seed-test-admin`** | **CRÍTICO** | Cria um admin com credenciais fixas (`admin@imobiliariateste.com.br` / `Teste123!`). Qualquer pessoa pode chamar e criar um usuário admin. Deveria ser removida em produção |
| **`text-to-speech`** | **ALTO** | Sem auth. Consome créditos da API OpenAI ($$). Qualquer pessoa pode gerar áudio ilimitado |
| **`elevenlabs-tts`** | **ALTO** | Sem auth. Consome créditos da ElevenLabs ($$). Mesmo problema |
| **`chat-assistente`** | **ALTO** | Sem auth. Consome créditos da Lovable AI. Qualquer pessoa pode usar o chatbot ilimitadamente |
| **`generate-pdf`** | **ALTO** | Sem auth. Aceita qualquer `ficha_id` e gera PDF com dados sensíveis (nomes, CPFs, telefones). Vazamento de dados pessoais |

---

### MÉDIO — Têm validação parcial ou dados limitados

| Função | Risco | Situação |
|--------|-------|----------|
| **`asaas-webhook-test`** | OK | Tem auth + check super_admin no código |
| **`master-login`** | MÉDIO | Valida `MASTER_PASSWORD`, mas é brute-forceable. Deveria ter rate limiting |
| **`get-ficha-externa`** | MÉDIO | Expõe dados de fichas por token. Aceitável se tokens são longos/aleatórios |
| **`otp-reminder`** | MÉDIO | Processa fila interna. Sem dados expostos diretamente |
| **`process-otp-queue`** | MÉDIO | Processa fila interna. Similar ao anterior |

---

### BAIXO/OK — Públicos por design

| Função | Situação |
|--------|----------|
| **`verify-otp`** | Público por design (visitante confirma visita) |
| **`get-otp-info`** | Público por design (página de confirmação) |
| **`verify-comprovante`** | Público (verificação de documento) |
| **`verify-pdf-integrity`** | Público (verificação) |
| **`registro-imobiliaria`** | Público (registro de novo usuário) |
| **`registro-corretor-autonomo`** | Público (registro) |
| **`get-imobiliaria-by-email`** | Público (busca durante registro) |
| **`aceitar-convite-externo`** | Público (aceitar convite via token) |
| **`get-survey-by-token`** | Público (pesquisa por token) |
| **`submit-survey-response`** | Público (responder pesquisa) |
| **`create-survey`** | Público (criar pesquisa — pode precisar revisão) |
| **`survey-og-page/serve-survey-meta/survey-og`** | Público (OG meta tags) |
| **`app-version`** | Público (verificar versão) |
| **`asaas-webhook`** | Webhook externo (deveria validar `ASAAS_WEBHOOK_TOKEN`) |

---

### Plano de Correção (priorizado)

**1. `seed-test-admin`** — REMOVER ou desativar. É uma função de desenvolvimento que não deveria existir em produção.

**2. `send-email`** — Adicionar auth gate idêntico ao `send-whatsapp`: verificar JWT + role `super_admin` ou `imobiliaria_admin`. Manter bypass para `service_role` (chamadas internas).

**3. `generate-pdf`** — Adicionar verificação: ou JWT válido de um usuário com acesso à ficha, ou chamada interna via `service_role`.

**4. `text-to-speech` e `elevenlabs-tts`** — Adicionar auth gate: exigir JWT de qualquer usuário autenticado (protege contra abuso externo).

**5. `chat-assistente`** — Adicionar rate limiting por IP ou exigir JWT básico.

**6. `master-login`** — Adicionar rate limiting (máx 5 tentativas por IP/minuto).

### Arquivos a alterar
- `supabase/functions/send-email/index.ts` — auth gate
- `supabase/functions/generate-pdf/index.ts` — auth gate
- `supabase/functions/text-to-speech/index.ts` — auth gate
- `supabase/functions/elevenlabs-tts/index.ts` — auth gate
- `supabase/functions/chat-assistente/index.ts` — auth gate ou rate limit
- `supabase/functions/seed-test-admin/index.ts` — remover ou bloquear

